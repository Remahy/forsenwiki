import { describe, expect, test } from 'vitest';
import { diffChars } from 'diff';
import {
	$createParagraphNode,
	$createTextNode,
	$getRoot,
	ParagraphNode,
	TextNode,
	type LexicalEditor,
	type SerializedEditorState,
	type SerializedLexicalNode,
} from 'lexical';
import { createHeadlessEditor } from '@lexical/headless';
import { $generateNodesFromDOM } from '@lexical/html';
import { $createHeadingNode, HeadingNode } from '@lexical/rich-text';
import { $createListItemNode, $createListNode, ListItemNode, ListNode } from '@lexical/list';

import { articleConfig } from './article';
import { diffConfig } from './diff';
import { EDITOR_IS_READONLY } from '$lib/constants/constants';
import {
	$createALinkNode,
	ALinkNode,
	DiffALinkNode,
	DiffHeadingNode,
	DiffListItemNode,
	DiffParagraphNode,
	DiffTextNode,
} from '$lib/lexical/custom';
import type { ___Change, ___ChangeTextNode } from '../plugins/Diff/Types';

type Change = ___Change | ___ChangeTextNode;

type SerializedNode = SerializedLexicalNode & {
	children?: SerializedNode[];
	___change?: Change;
	[key: string]: unknown;
};

const rootOf = (state: SerializedEditorState) => state.root as SerializedNode;

/** Walks down `children` by index. */
const at = (node: SerializedNode, ...path: number[]) =>
	path.reduce((parent, index) => {
		const child = parent.children?.[index];

		if (!child) {
			throw new Error(`No child at index ${index} of "${parent.type}".`);
		}

		return child;
	}, node);

const typesOf = (node: SerializedNode) => (node.children ?? []).map(({ type }) => type);

/** Same transformation `getDiffJSON` applies to changed nodes. */
const DiffNode = (node: SerializedNode, change: Change): SerializedNode => ({
	...node,
	type: `diff-${node.type}`,
	___change: change,
});

/** Replaces the node at `path` with its Diff variant. */
const replaceWithDiff = (root: SerializedNode, path: number[], change: Change) => {
	const parent = at(root, ...path.slice(0, -1));
	const index = path[path.length - 1];
	const children = parent.children ?? [];

	children[index] = DiffNode(children[index], change);
};

const headingChange: ___Change = { ___type: '~', tag: { __old: 'h1', __new: 'h2' } };
const textChange: ___ChangeTextNode = {
	___type: '~',
	text: {
		__old: 'Hello word',
		__new: 'Hello world',
		diff: diffChars('Hello word', 'Hello world'),
	},
};

/** Builds an article, then turns some of its nodes into Diff nodes. */
const createMixedEditorState = () => {
	const article = createHeadlessEditor(articleConfig(null, EDITOR_IS_READONLY, null));

	article.update(
		() => {
			$getRoot().append(
				$createHeadingNode('h2').append($createTextNode('Title')),
				$createParagraphNode().append(
					$createTextNode('Unchanged '),
					$createALinkNode('https://forsen.wiki', {}, false, undefined).append(
						$createTextNode('link')
					)
				),
				$createParagraphNode().append($createTextNode('Hello world')),
				$createListNode('bullet').append(
					$createListItemNode().append($createTextNode('Kept')),
					$createListItemNode().append($createTextNode('Removed'))
				)
			);
		},
		{ discrete: true }
	);

	const state = article.getEditorState().toJSON();
	const root = rootOf(state);

	// Diff node with normal children.
	replaceWithDiff(root, [0], headingChange);

	// Normal node with a Diff child, which itself has normal children.
	replaceWithDiff(root, [1, 1], { ___type: '+' });

	// Diff node with Diff children.
	replaceWithDiff(root, [2], { ___type: '~' });
	replaceWithDiff(root, [2, 0], textChange);

	// Normal list containing both a normal and a Diff list item.
	replaceWithDiff(root, [3, 1], { ___type: '-' });

	return state;
};

const createDiffEditor = (editorState: SerializedEditorState) => {
	const editor = createHeadlessEditor(diffConfig(null, EDITOR_IS_READONLY, null));

	editor.setEditorState(editor.parseEditorState(editorState));

	return editor;
};

const exportRoot = (editor: LexicalEditor) => rootOf(editor.getEditorState().toJSON());

const parseHTML = (html: string) =>
	new DOMParser().parseFromString(`<html><body>${html}</body></html>`, 'text/html');

describe('diff editor with Diff and normal nodes', () => {
	test('parses each node into its own class', () => {
		const editor = createDiffEditor(createMixedEditorState());

		editor.read(() => {
			const [heading, linkParagraph, textParagraph, list] = $getRoot().getChildren() as [
				DiffHeadingNode,
				ParagraphNode,
				DiffParagraphNode,
				ListNode,
			];

			expect(heading).toBeInstanceOf(DiffHeadingNode);
			expect(heading.getTag()).toBe('h2');
			expect(heading.getFirstChildOrThrow().constructor).toBe(TextNode);

			expect(linkParagraph.constructor).toBe(ParagraphNode);
			expect(linkParagraph.getFirstChildOrThrow().constructor).toBe(TextNode);
			const link = linkParagraph.getLastChildOrThrow() as DiffALinkNode;
			expect(link).toBeInstanceOf(DiffALinkNode);
			expect(link.getURL()).toBe('https://forsen.wiki');
			expect(link.getFirstChildOrThrow().constructor).toBe(TextNode);

			expect(textParagraph).toBeInstanceOf(DiffParagraphNode);
			expect(textParagraph.getFirstChildOrThrow()).toBeInstanceOf(DiffTextNode);

			expect(list.constructor).toBe(ListNode);
			const [kept, removed] = list.getChildren() as ListItemNode[];
			expect(kept.constructor).toBe(ListItemNode);
			expect(removed).toBeInstanceOf(DiffListItemNode);
			expect(removed.getTextContent()).toBe('Removed');
		});
	});

	test('round-trips through JSON without losing diff data', () => {
		const input = createMixedEditorState();
		const exported = createDiffEditor(input).getEditorState().toJSON();

		expect(createDiffEditor(exported).getEditorState().toJSON()).toEqual(exported);

		const root = rootOf(exported);
		expect(typesOf(root)).toEqual(['diff-heading', 'paragraph', 'diff-paragraph', 'list']);
		expect(at(root, 0).___change).toEqual(headingChange);
		expect(at(root, 1, 1).type).toBe('diff-a-link');
		expect(at(root, 1, 1, 0).type).toBe('text');
		expect(at(root, 2, 0).___change).toEqual(textChange);
		expect(at(root, 3, 1).type).toBe('diff-listitem');
	});

	test('keeps diff data when nodes are edited and mixed further', () => {
		const editor = createDiffEditor(createMixedEditorState());

		editor.update(
			() => {
				const [heading, linkParagraph, textParagraph] = $getRoot().getChildren() as [
					DiffHeadingNode,
					ParagraphNode,
					DiffParagraphNode,
				];

				// Forces clones of both Diff and normal nodes.
				heading.setTag('h3');
				(textParagraph.getFirstChildOrThrow() as DiffTextNode).setTextContent('Hello world!');
				textParagraph.append($createTextNode(' Appended'));
				(linkParagraph.getFirstChildOrThrow() as TextNode).setTextContent('Still unchanged ');
			},
			{ discrete: true }
		);

		const root = exportRoot(editor);

		expect(at(root, 0)).toMatchObject({ type: 'diff-heading', tag: 'h3' });
		expect(at(root, 0).___change).toEqual(headingChange);

		expect(at(root, 2).type).toBe('diff-paragraph');
		expect(at(root, 2).___change).toEqual({ ___type: '~' });
		expect(typesOf(at(root, 2))).toEqual(['diff-text', 'text']);
		expect(at(root, 2, 0).text).toBe('Hello world!');
		expect(at(root, 2, 0).___change?.___type).toBe('~');

		expect(at(root, 1).type).toBe('paragraph');
		expect(at(root, 1, 0)).toMatchObject({ type: 'text', text: 'Still unchanged ' });
		expect(at(root, 1, 0)).not.toHaveProperty('___change');
	});

	test('imports HTML as normal nodes alongside Diff nodes', () => {
		const editor = createDiffEditor(createMixedEditorState());

		editor.update(
			() => {
				const dom = parseHTML('<h3>Pasted</h3><p>Text <a href="https://example.com">link</a></p>');

				$getRoot().append(...$generateNodesFromDOM(editor, dom));
			},
			{ discrete: true }
		);

		editor.read(() => {
			const children = $getRoot().getChildren();
			expect(children).toHaveLength(6);

			expect(children[0]).toBeInstanceOf(DiffHeadingNode);
			expect(children[2]).toBeInstanceOf(DiffParagraphNode);

			const [heading, paragraph] = children.slice(4) as [HeadingNode, ParagraphNode];
			expect(heading.constructor).toBe(HeadingNode);
			expect(heading.getTag()).toBe('h3');
			expect(paragraph.constructor).toBe(ParagraphNode);
			expect(paragraph.getLastChildOrThrow().constructor).toBe(ALinkNode);
		});
	});
});
