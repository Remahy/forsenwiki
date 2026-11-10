import * as Y from '@y/y';
import { expect, test } from 'vitest';
import {
	$createParagraphNode,
	$createTextNode,
	$getEditor,
	$getRoot,
	$isElementNode,
	$isTextNode,
	type LexicalNode,
} from 'lexical';
import { $generateHtmlFromNodes } from '@lexical/html';
import { $createHeadingNode, $isHeadingNode } from '@lexical/rich-text';
import { $createListItemNode, $createListNode } from '@lexical/list';
import { uint8ArrayToBase64 } from 'uint8array-extras';

import { articleExtension } from '$lib/components/editor/config/article';
import { $getDiffMark, diffExtension } from '$lib/components/editor/config/diff';
import { EDITOR_IS_READONLY } from '$lib/constants/constants';
import { $createALinkNode, $createImageNode } from '$lib/lexical/custom';
import { getYAndEditor, readState, seedState } from './headless';
import { createDiffUpdates } from './diff';

const article = () => articleExtension(null, EDITOR_IS_READONLY, null);

type Row = { content: string; createdTimestamp: Date; metadata: { userId: string } };

const row = (update: Uint8Array, userId: string, at: number): Row => ({
	content: uint8ArrayToBase64(update),
	createdTimestamp: new Date(at),
	metadata: { userId },
});

const stateOf = (rows: Row[]) =>
	Y.mergeUpdatesV2(rows.map(({ content }) => Uint8Array.from(Buffer.from(content, 'base64'))));

/** Stores an edit the way the update endpoint does. */
const edit = async (rows: Row[], userId: string, $edit: () => void) => {
	const current = stateOf(rows);
	const opened = getYAndEditor(article(), current);

	opened.editor.update($edit, { discrete: true });

	const update = Y.diffUpdateV2(await opened.encodeV2(), Y.encodeStateVectorFromUpdateV2(current));

	opened.dispose();

	return [...rows, row(update, userId, (rows.length + 1) * 1000)];
};

const seed = ($build: () => void) => [row(seedState(article(), $build), 'alice', 1000)];

const outline = (rows: Row[], from: number, to: number, side: 'newer' | 'older' = 'newer') =>
	readState(
		diffExtension(null, EDITOR_IS_READONLY, null),
		createDiffUpdates(rows, from, to)[side],
		() => {
			const walk = (node: LexicalNode, depth: number): string[] => {
				const mark = $getDiffMark(node);
				const label = [
					node.getType(),
					$isTextNode(node) ? JSON.stringify(node.getTextContent()) : null,
					$isTextNode(node) && node.getFormat() ? `format=${node.getFormat()}` : null,
					$isHeadingNode(node) ? node.getTag() : null,
					mark ? `${mark.type}:${mark.by}` : null,
					mark?.fields ? JSON.stringify(mark.fields) : null,
				]
					.filter(Boolean)
					.join(' ');

				return [
					'  '.repeat(depth) + label,
					...($isElementNode(node) ? node.getChildren().flatMap((c) => walk(c, depth + 1)) : []),
				];
			};

			return {
				tree: $getRoot()
					.getChildren()
					.flatMap((c) => walk(c, 0)),
				html: $generateHtmlFromNodes($getEditor(), null),
			};
		}
	);

const heading = () => $createHeadingNode('h2').append($createTextNode('Title'));
const paragraph = (text: string) => $createParagraphNode().append($createTextNode(text));
const children = () => $getRoot().getChildren() as any[];

test('inserted, deleted and reformatted text is marked with its author', async () => {
	let rows = seed(() => $getRoot().append(paragraph('Hello World!')));

	rows = await edit(rows, 'bob', () => {
		const [hell, rest] = children()[0].getFirstChild().splitText(4);
		hell.toggleFormat('bold');
		rest.splitText(2, 7)[1].setTextContent('attributions');
	});

	expect(outline(rows, 0, 1).tree).toEqual([
		'paragraph change:bob',
		'  text "Hell" format=1 change:bob {"bold":{"__new":true}}',
		'  text "o "',
		'  text "World" delete:bob',
		'  text "attributions" insert:bob',
		'  text "!"',
	]);
	expect(outline(rows, 0, 1, 'older').tree[1]).toBe(
		'  text "Hell" change:bob {"bold":{"__new":true}}'
	);
});

test('a format that replaces another names both', async () => {
	let rows = seed(() => {
		const bold = $createTextNode('bold');
		bold.toggleFormat('bold');
		$getRoot().append($createParagraphNode().append(bold, $createTextNode(' plain')));
	});

	rows = await edit(rows, 'bob', () => {
		const text = children()[0].getFirstChild();
		text.toggleFormat('bold');
		text.toggleFormat('italic');
	});

	expect(outline(rows, 0, 1).tree).toEqual([
		'paragraph change:bob',
		'  text "bold" format=2 change:bob {"bold":{"__old":true},"italic":{"__new":true}}',
		'  text " plain"',
	]);
	expect(outline(rows, 0, 1, 'older').tree).toEqual([
		'paragraph change:bob',
		'  text "bold" format=1 change:bob {"bold":{"__old":true},"italic":{"__new":true}}',
		'  text " plain"',
	]);
});

test('the older side shows links and formats as they were', async () => {
	let rows = seed(() => $getRoot().append(paragraph('Plain linked')));

	rows = await edit(rows, 'bob', () => {
		const [, linked] = children()[0].getFirstChild().splitText(6);
		const link = $createALinkNode('https://forsen.wiki', {}, false, undefined);
		linked.insertBefore(link);
		link.append(linked);
	});

	expect(outline(rows, 0, 1).tree.map((line) => line.trim().split(' ')[0])).toEqual([
		'paragraph',
		'text',
		'a-link',
		'text',
	]);
	expect(outline(rows, 0, 1, 'older').tree.map((line) => line.trim().split(' ')[0])).toEqual([
		'paragraph',
		'text',
		'text',
	]);

	rows = await edit(rows, 'carol', () => children()[0].getChildren()[1].remove());
	rows = await edit(rows, 'dave', () => children()[0].getFirstChild().toggleFormat('bold'));

	expect(outline(rows, 2, 3, 'older').tree).toEqual([
		'paragraph change:dave',
		'  text "Plain " change:dave {"bold":{"__new":true}}',
	]);
});

test('removed and added blocks are shown whole, changed fields with their values', async () => {
	let rows = seed(() =>
		$getRoot().append(heading(), paragraph('Kept'), paragraph('Removed'), paragraph('Last'))
	);

	rows = await edit(rows, 'bob', () => {
		const [title, kept, removed] = children();
		title.setTag('h3');
		removed.remove();
		kept.insertBefore(paragraph('Added'));
	});

	expect(outline(rows, 0, 1, 'older').tree[0]).toBe(
		'heading h2 change:bob {"tag":{"__old":"h2","__new":"h3"}}'
	);
	expect(outline(rows, 0, 1).tree).toEqual([
		'heading h3 change:bob {"tag":{"__old":"h2","__new":"h3"}}',
		'  text "Title"',
		'paragraph insert:bob',
		'  text "Added" insert:bob',
		'paragraph',
		'  text "Kept"',
		'paragraph delete:bob',
		'  text "Removed" delete:bob',
		'paragraph',
		'  text "Last"',
	]);
});

test('a removed list item is shown in its list', async () => {
	let rows = seed(() =>
		$getRoot().append(
			$createListNode('bullet').append(
				$createListItemNode().append($createTextNode('one')),
				$createListItemNode().append($createTextNode('two')),
				$createListItemNode().append($createTextNode('three'))
			)
		)
	);

	rows = await edit(rows, 'bob', () => children()[0].getChildren()[1].remove());

	expect(outline(rows, 0, 1).tree).toEqual([
		'list change:bob',
		'  listitem',
		'    text "one"',
		'  listitem delete:bob',
		'    text "two" delete:bob',
		'  listitem',
		'    text "three"',
	]);
});

test('added and removed images are marked', async () => {
	let rows = seed(() =>
		$getRoot().append(
			paragraph('Text'),
			$createParagraphNode().append(
				$createImageNode({ src: 'https://forsen.wiki/a.png', altText: 'a', width: 10, height: 10 })
			)
		)
	);

	rows = await edit(rows, 'bob', () => {
		children()[1].getFirstChild().remove();
		children()[0].append(
			$createImageNode({ src: 'https://forsen.wiki/b.png', altText: 'b', width: 10, height: 10 })
		);
	});

	const { tree, html } = outline(rows, 0, 1);

	expect(tree).toEqual([
		'paragraph change:bob',
		'  text "Text"',
		'  image insert:bob',
		'paragraph delete:bob',
		'  image delete:bob',
	]);
	expect(html).toMatch(/<span data-diff="insert" data-diff-by="bob"[^>]*><img /);
});

test('splitting and merging lines is shown as a changed line break', async () => {
	let rows = seed(() => $getRoot().append(paragraph('First Second')));

	rows = await edit(rows, 'bob', () => {
		children()[0].getFirstChild().select(5, 5).insertParagraph();
	});

	expect(outline(rows, 0, 1).tree).toEqual([
		'paragraph change:bob {"line break":{"__new":true}}',
		'  text "First"',
		'paragraph',
		'  text " Second"',
	]);

	rows = await edit(rows, 'carol', () => {
		const [first, second] = children();
		first.append(...second.getChildren());
		second.remove();
	});

	expect(outline(rows, 1, 2).tree).toEqual([
		'paragraph change:carol {"line break":{"__old":true}}',
		'  text "First"',
		'paragraph',
		'  text " Second"',
	]);
});

test('a range of versions attributes each change to who made it', async () => {
	let rows = seed(() => $getRoot().append(paragraph('Base')));

	rows = await edit(rows, 'bob', () => children()[0].append($createTextNode(' bob temporary')));
	rows = await edit(rows, 'carol', () => {
		const text = children()[0].getFirstChild();
		text.setTextContent(text.getTextContent().replace(' temporary', ''));
		$getRoot().append(paragraph('Carol'));
	});

	expect(outline(rows, 0, 2).tree).toEqual([
		'paragraph change:bob',
		'  text "Base"',
		'  text " bob" insert:bob',
		'paragraph insert:carol',
		'  text "Carol" insert:carol',
	]);
	expect(outline(rows, 1, 2).tree).toEqual([
		'paragraph change:carol',
		'  text "Base bob"',
		'  text " temporary" delete:carol',
		'paragraph insert:carol',
		'  text "Carol" insert:carol',
	]);
	expect(outline(rows, 0, 0).tree).toEqual(['paragraph', '  text "Base"']);
});

test('marks are exported as colours, data attributes and hovers', async () => {
	let rows = seed(() => $getRoot().append(heading(), paragraph('Hello World')));

	rows = await edit(rows, 'bob', () => {
		const [title, body] = children();
		title.setTag('h3');
		const [hello, , world] = body.getFirstChild().splitText(2, 6);
		hello.toggleFormat('bold');
		world.remove();
		body.append($createTextNode('there'));
	});

	const container = document.createElement('div');
	container.innerHTML = outline(rows, 0, 1).html;

	const marked = [...container.querySelectorAll<HTMLElement>('[data-diff]')].map((element) => [
		element.tagName,
		element.dataset.diff,
		element.dataset.diffBy,
		element.dataset.diffAt,
	]);

	expect(marked).toEqual([
		['H3', 'change', 'bob', '2000'],
		['P', 'change', 'bob', '2000'],
		['B', 'change', 'bob', '2000'],
		['SPAN', 'delete', 'bob', '2000'],
		['SPAN', 'insert', 'bob', '2000'],
	]);

	expect(container.querySelector('[id]')).toBeNull();
	expect(container.querySelector('h3 > span[title]')?.getAttribute('title')).toBe(
		'~ "tag" changed from "h2" to "h3".'
	);
	expect(container.querySelector('b')?.title).toBe('+ "bold" added with the value true.');
	expect(container.querySelector<HTMLElement>('[data-diff="delete"]')?.style.textDecoration).toBe(
		'line-through'
	);
});
