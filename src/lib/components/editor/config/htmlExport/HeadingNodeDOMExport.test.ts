import { expect, test } from 'vitest';
import { $createParagraphNode, $createTextNode, $getRoot, type LexicalEditor } from 'lexical';
import {
	$getBlockId,
	BlockIdExtension,
	buildEditorFromExtensions,
	configExtension,
} from '@lexical/extension';
import { HeadlessExtension } from '@lexical/headless';
import { $generateHtmlFromNodes } from '@lexical/html';
import { $createHeadingNode, $isHeadingNode } from '@lexical/rich-text';

import { articleExtension } from '../article';
import { EDITOR_IS_READONLY } from '$lib/constants/constants';

const createEditor = (...extensions: Parameters<typeof buildEditorFromExtensions>) =>
	buildEditorFromExtensions(
		HeadlessExtension,
		articleExtension(null, EDITOR_IS_READONLY, null),
		...extensions
	);

const build = (editor: LexicalEditor, headings: string[]) =>
	editor.update(
		() => {
			$getRoot().append(
				...headings.map((text) => $createHeadingNode('h2').append($createTextNode(text))),
				$createParagraphNode()
			);
		},
		{ discrete: true }
	);

const anchors = (editor: LexicalEditor) =>
	editor.read(() => {
		const dom = new DOMParser().parseFromString($generateHtmlFromNodes(editor, null), 'text/html');
		return [...dom.querySelectorAll('h2')].map(({ id }) => id);
	});

const headingIds = (editor: LexicalEditor) =>
	editor.read(() => $getRoot().getChildren().filter($isHeadingNode).map($getBlockId));

test('unique headings keep their slug', () => {
	const editor = createEditor();
	build(editor, ['Early life', 'Career!']);

	expect(anchors(editor)).toEqual(['Early-life', 'Career']);
});

test('later headings with the same slug get their block id appended', () => {
	const editor = createEditor();
	build(editor, ['Early life', 'Career', 'Early life?', 'Early life']);
	const ids = headingIds(editor);

	expect(anchors(editor)).toEqual([
		'Early-life',
		'Career',
		`Early-life-${ids[2]}`,
		`Early-life-${ids[3]}`,
	]);
});

test('the first heading in the document keeps the slug, not the first one created', () => {
	const editor = createEditor();
	build(editor, ['Early life']);
	editor.update(
		() => {
			$getRoot()
				.getFirstChildOrThrow()
				.insertBefore($createHeadingNode('h2').append($createTextNode('Early life')));
		},
		{ discrete: true }
	);
	const ids = headingIds(editor);

	expect(anchors(editor)).toEqual(['Early-life', `Early-life-${ids[1]}`]);
});

test('a heading without a slug uses its block id', () => {
	const editor = createEditor();
	build(editor, ['???']);

	expect(anchors(editor)).toEqual([headingIds(editor)[0]]);
});

test('falls back to the slug without block ids', () => {
	const editor = createEditor(configExtension(BlockIdExtension, { disabled: true }));
	build(editor, ['Early life', 'Early life']);

	expect(anchors(editor)).toEqual(['Early-life', 'Early-life']);
});
