import * as Y from '@y/y';
import { expect, test } from 'vitest';
import {
	$createLineBreakNode,
	$createParagraphNode,
	$createTextNode,
	$getEditor,
	$getRoot,
	$isElementNode,
	$isTextNode,
	type LexicalNode,
} from 'lexical';
import { buildEditorFromExtensions } from '@lexical/extension';
import { HeadlessExtension } from '@lexical/headless';
import { $generateHtmlFromNodes } from '@lexical/html';
import { $createHeadingNode, $isHeadingNode } from '@lexical/rich-text';
import { $createListItemNode, $createListNode } from '@lexical/list';

import { articleExtension } from '$lib/components/editor/config/article';
import { $getDiffMark, diffExtension } from '$lib/components/editor/config/diff';
import { EDITOR_IS_READONLY } from '$lib/constants/constants';
import { $createALinkNode, $createImageNode } from '$lib/lexical/custom';
import { getYAndEditor, readState, seedState } from '$lib/y/headless';
import { blockIdOf, diffEditorStates, INLINE_WRAPPERS } from './diffEditorState';
import type { SerializedNode, SerializedState } from './patchEditorState';

const article = () => articleExtension(null, EDITOR_IS_READONLY, null);

const $json = () => $getEditor().getEditorState().toJSON() as unknown as SerializedState;

type Version = { state: Uint8Array; json: SerializedState; by: string; at: number };

const version = (state: Uint8Array, by: string, at: number): Version => ({
	state,
	json: readState(article(), state, $json),
	by,
	at,
});

const seed = ($build: () => void) => [version(seedState(article(), $build), 'alice', 1000)];

const edit = async (versions: Version[], by: string, $edit: () => void) => {
	const opened = getYAndEditor(article(), versions[versions.length - 1].state);

	opened.editor.update($edit, { discrete: true });

	const state = await opened.encodeV2();

	opened.dispose();

	return [...versions, version(Y.mergeUpdatesV2([state]), by, (versions.length + 1) * 1000)];
};

const render = (blocks: Array<SerializedNode | null>) => {
	if (!blocks.some((block) => block !== null)) {
		return { tree: [], html: '' };
	}

	const editor = buildEditorFromExtensions(
		HeadlessExtension,
		diffExtension(null, EDITOR_IS_READONLY, null)
	);

	editor.setEditorState(
		editor.parseEditorState({
			root: {
				type: 'root',
				version: 1,
				format: '',
				indent: 0,
				direction: null,
				children: blocks.filter((block) => block !== null),
			},
		} as never)
	);

	const result = editor.read(() => {
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
	});

	editor.dispose();

	return result;
};

const compare = (versions: Version[], from: number, to: number) => {
	const { by, at } = versions[to];
	const { rows, partial } = diffEditorStates(versions[from].json, versions[to].json, {
		attribute: () => ({ by, at }),
	});

	return {
		rows,
		partial,
		older: render(rows.map((row) => row.older)),
		newer: render(rows.map((row) => row.newer)),
	};
};

const heading = () => $createHeadingNode('h2').append($createTextNode('Title'));
const paragraph = (text: string) => $createParagraphNode().append($createTextNode(text));
const children = () => $getRoot().getChildren() as any[];

test('the inline elements whose text belongs to their line are the inline elements of an article', () => {
	const editor = buildEditorFromExtensions(HeadlessExtension, article());

	const inline = editor.read(() =>
		[...editor._nodes.values()]
			.map(({ klass }) => klass)
			.filter((klass) => {
				const node = Object.create(klass.prototype);
				return $isElementNode(node) && node.isInline();
			})
			.map((klass) => klass.getType())
	);

	editor.dispose();

	expect(new Set(inline)).toEqual(INLINE_WRAPPERS);
});

test('two equal versions have nothing to show', async () => {
	const versions = seed(() => $getRoot().append(heading(), paragraph('Kept')));

	expect(compare(versions, 0, 0).rows).toEqual([]);
});

test('removed, added and reformatted words are marked with who changed them', async () => {
	let versions = seed(() => $getRoot().append(paragraph('Hello World!'), paragraph('Kept')));

	versions = await edit(versions, 'bob', () => {
		const [hell, rest] = children()[0].getFirstChild().splitText(4);
		hell.toggleFormat('bold');
		rest.splitText(2, 7)[1].setTextContent('attributions');
	});

	const { older, newer, rows } = compare(versions, 0, 1);

	expect(rows).toHaveLength(1);
	expect(older.tree).toEqual([
		'paragraph change:bob',
		'  text "Hell" change:bob {"bold":{"__new":true}}',
		'  text "o "',
		'  text "World" delete:bob',
		'  text "!"',
	]);
	expect(newer.tree).toEqual([
		'paragraph change:bob',
		'  text "Hell" format=1 change:bob {"bold":{"__new":true}}',
		'  text "o "',
		'  text "attributions" insert:bob',
		'  text "!"',
	]);
});

test('a changed letter is marked inside its word', async () => {
	let versions = seed(() => $getRoot().append(paragraph('The color of it')));

	versions = await edit(versions, 'bob', () =>
		children()[0].getFirstChild().setTextContent('The colour of it')
	);

	const { older, newer } = compare(versions, 0, 1);

	expect(older.tree).toEqual(['paragraph change:bob', '  text "The color of it"']);
	expect(newer.tree).toEqual([
		'paragraph change:bob',
		'  text "The colo"',
		'  text "u" insert:bob',
		'  text "r of it"',
	]);
});

test('a format that replaces another names both', async () => {
	let versions = seed(() => {
		const bold = $createTextNode('bold');
		bold.toggleFormat('bold');
		$getRoot().append($createParagraphNode().append(bold, $createTextNode(' plain')));
	});

	versions = await edit(versions, 'bob', () => {
		const text = children()[0].getFirstChild();
		text.toggleFormat('bold');
		text.toggleFormat('italic');
	});

	const { older, newer } = compare(versions, 0, 1);

	expect(older.tree).toEqual([
		'paragraph change:bob',
		'  text "bold" format=1 change:bob {"bold":{"__old":true},"italic":{"__new":true}}',
		'  text " plain"',
	]);
	expect(newer.tree).toEqual([
		'paragraph change:bob',
		'  text "bold" format=2 change:bob {"bold":{"__old":true},"italic":{"__new":true}}',
		'  text " plain"',
	]);
});

test('a link put around text is a change of that text', async () => {
	let versions = seed(() => $getRoot().append(paragraph('Plain linked')));

	versions = await edit(versions, 'bob', () => {
		const [, linked] = children()[0].getFirstChild().splitText(6);
		const link = $createALinkNode('https://forsen.wiki', {}, false, undefined);
		linked.insertBefore(link);
		link.append(linked);
	});

	const { older, newer } = compare(versions, 0, 1);

	expect(older.tree).toEqual([
		'paragraph change:bob',
		'  text "Plain "',
		'  text "linked" change:bob {"a-link":{"__new":"https://forsen.wiki"}}',
	]);
	expect(newer.tree).toEqual([
		'paragraph change:bob',
		'  text "Plain "',
		'  a-link change:bob',
		'    text "linked" change:bob {"a-link":{"__new":"https://forsen.wiki"}}',
	]);
});

test('removed and added blocks are shown whole, changed fields with their values', async () => {
	let versions = seed(() =>
		$getRoot().append(heading(), paragraph('Kept'), paragraph('Removed'), paragraph('Last'))
	);

	versions = await edit(versions, 'bob', () => {
		const [title, kept, removed] = children();
		title.setTag('h3');
		removed.remove();
		kept.insertBefore(paragraph('Added'));
	});

	const { rows, older, newer } = compare(versions, 0, 1);

	expect(rows.map((row) => [row.older?.type ?? null, row.newer?.type ?? null])).toEqual([
		['heading', 'heading'],
		[null, 'paragraph'],
		['paragraph', null],
	]);
	expect(rows.map((row) => row.start)).toEqual([
		{ older: 1, newer: 1 },
		undefined,
		{ older: 3, newer: 4 },
	]);
	expect(older.tree).toEqual([
		'heading h2 change:bob {"tag":{"__old":"h2","__new":"h3"}}',
		'  text "Title"',
		'paragraph delete:bob',
		'  text "Removed" delete:bob',
	]);
	expect(newer.tree).toEqual([
		'heading h3 change:bob {"tag":{"__old":"h2","__new":"h3"}}',
		'  text "Title"',
		'paragraph insert:bob',
		'  text "Added" insert:bob',
	]);
});

test('a removed list item is shown in its list', async () => {
	let versions = seed(() =>
		$getRoot().append(
			$createListNode('bullet').append(
				$createListItemNode().append($createTextNode('one')),
				$createListItemNode().append($createTextNode('two')),
				$createListItemNode().append($createTextNode('three'))
			)
		)
	);

	versions = await edit(versions, 'bob', () => children()[0].getChildren()[1].remove());

	const { older, newer } = compare(versions, 0, 1);

	expect(older.tree).toEqual([
		'list change:bob',
		'  listitem',
		'    text "one"',
		'  listitem delete:bob',
		'    text "two" delete:bob',
		'  listitem',
		'    text "three"',
	]);
	expect(newer.tree).toEqual([
		'list change:bob',
		'  listitem',
		'    text "one"',
		'  listitem',
		'    text "three"',
	]);
});

test('added, removed and replaced images are marked', async () => {
	const image = (name: string) =>
		$createImageNode({
			src: `https://forsen.wiki/${name}.png`,
			altText: name,
			width: 10,
			height: 10,
		});

	let versions = seed(() =>
		$getRoot().append(
			paragraph('Text'),
			$createParagraphNode().append(image('a')),
			$createParagraphNode().append($createTextNode('Before '), image('c'))
		)
	);

	versions = await edit(versions, 'bob', () => {
		children()[1].getFirstChild().remove();
		children()[0].append(image('b'));
		children()[2].getLastChild().replace(image('d'));
	});

	const { older, newer } = compare(versions, 0, 1);

	expect(older.tree).toEqual([
		'paragraph change:bob',
		'  text "Text"',
		'paragraph delete:bob',
		'  image delete:bob',
		'paragraph change:bob',
		'  text "Before "',
		'  image change:bob {"src":{"__old":"https://forsen.wiki/c.png","__new":"https://forsen.wiki/d.png"},"altText":{"__old":"c","__new":"d"}}',
	]);
	expect(newer.tree).toEqual([
		'paragraph change:bob',
		'  text "Text"',
		'  image insert:bob',
		'paragraph change:bob',
		'paragraph change:bob',
		'  text "Before "',
		'  image change:bob {"src":{"__old":"https://forsen.wiki/c.png","__new":"https://forsen.wiki/d.png"},"altText":{"__old":"c","__new":"d"}}',
	]);
	expect(newer.html).toMatch(/<span data-diff="insert" data-diff-by="bob"[^>]*><img /);
});

test('a split paragraph shows what moved out of it as removed, and the new paragraph as added', async () => {
	let versions = seed(() => $getRoot().append(paragraph('First Second')));

	versions = await edit(versions, 'bob', () => {
		children()[0].getFirstChild().select(5, 5).insertParagraph();
	});

	const { older, newer } = compare(versions, 0, 1);

	expect(older.tree).toEqual([
		'paragraph change:bob',
		'  text "First"',
		'  text " Second" delete:bob',
	]);
	expect(newer.tree).toEqual([
		'paragraph change:bob',
		'  text "First"',
		'paragraph insert:bob',
		'  text " Second" insert:bob',
	]);
});

test('an added or removed block without text is flagged as blank', async () => {
	let versions = seed(() => $getRoot().append(paragraph('Kept'), paragraph(' ')));

	versions = await edit(versions, 'bob', () => {
		const [kept, spaces] = children();
		spaces.remove();
		kept.insertBefore($createParagraphNode());
		kept.insertAfter(paragraph('Added'));
	});

	const { older, newer } = compare(versions, 0, 1);
	const blank = (html: string) => html.match(/<p[^>]*data-diff-blank[^>]*>/g) ?? [];

	expect(blank(older.html)).toHaveLength(1);
	expect(blank(older.html)[0]).toContain('data-diff="delete"');
	expect(blank(newer.html)).toHaveLength(1);
	expect(blank(newer.html)[0]).toContain('data-diff="insert"');
});

test('an added line break is flagged as a break, and does not make its block blank', async () => {
	let versions = seed(() => $getRoot().append(paragraph('Kept'), paragraph('First')));

	versions = await edit(versions, 'bob', () => {
		const [kept, first] = children();
		first.append($createLineBreakNode());
		kept.insertAfter($createParagraphNode().append($createLineBreakNode()));
	});

	const { newer } = compare(versions, 0, 1);

	expect(newer.html).not.toContain('data-diff-blank');
	expect(newer.html.match(/<span[^>]*data-diff-break[^>]*><br><\/span>/g)).toHaveLength(2);
});

test('a moved block is shown as removed where it was and added where it is', async () => {
	let versions = seed(() => $getRoot().append(paragraph('Moved'), paragraph('Kept'), heading()));

	versions = await edit(versions, 'bob', () => {
		const [moved] = children();
		moved.remove();
		$getRoot().append(moved);
	});

	const { rows } = compare(versions, 0, 1);

	expect(rows.map((row) => [row.older?.type ?? null, row.newer?.type ?? null])).toEqual([
		['paragraph', null],
		[null, 'paragraph'],
	]);
	expect(rows.map((row) => row.start)).toEqual([
		{ older: 1, newer: 1 },
		{ older: 4, newer: 3 },
	]);
});

test('a block that became another type is compared with what it was', () => {
	const block = (type: string, text: string, extra = {}) =>
		({
			type,
			version: 1,
			$: { blockId: 'same-block' },
			children: [
				{ type: 'text', version: 1, text, format: 0, style: '', mode: 'normal', detail: 0 },
			],
			direction: null,
			format: '',
			indent: 0,
			...extra,
		}) as unknown as SerializedNode;

	const { rows } = diffEditorStates(
		{ root: { children: [block('paragraph', 'Now a title')] } },
		{ root: { children: [block('heading', 'Now a heading', { tag: 'h2' })] } }
	);

	expect(render(rows.map((row) => row.newer)).tree).toEqual([
		'heading h2 change:undefined {"type":{"__old":"paragraph","__new":"heading"},"tag":{"__new":"h2"}}',
		'  text "Now a "',
		'  text "heading" insert:undefined',
	]);
});

test('every change of a block is attributed to who changed the block', async () => {
	let versions = seed(() => $getRoot().append(paragraph('First'), paragraph('Second')));

	versions = await edit(versions, 'bob', () => children()[0].append($createTextNode(' bob')));
	versions = await edit(versions, 'carol', () => children()[1].append($createTextNode(' carol')));

	const [first, second] = versions[2].json.root.children.map(blockIdOf);
	const authors = {
		[first as string]: { by: 'bob', at: 2000 },
		[second as string]: { by: 'carol', at: 3000 },
	};

	const { rows } = diffEditorStates(versions[0].json, versions[2].json, {
		attribute: ({ newer }) => authors[newer as string],
	});

	expect(render(rows.map((row) => row.newer)).tree).toEqual([
		'paragraph change:bob',
		'  text "First"',
		'  text " bob" insert:bob',
		'paragraph change:carol',
		'  text "Second"',
		'  text " carol" insert:carol',
	]);
});

test('a comparison that runs out of time shows the remaining blocks whole', async () => {
	let versions = seed(() => $getRoot().append(paragraph('Hello World'), paragraph('Kept')));

	versions = await edit(versions, 'bob', () =>
		children()[0].getFirstChild().setTextContent('Hello there')
	);

	const { rows, partial } = diffEditorStates(versions[0].json, versions[1].json, { timeout: -1 });

	expect(partial).toBe(true);
	expect(render(rows.map((row) => row.older)).tree).toEqual([
		'paragraph delete:undefined',
		'  text "Hello World" delete:undefined',
	]);
	expect(render(rows.map((row) => row.newer)).tree).toEqual([
		'paragraph insert:undefined',
		'  text "Hello there" insert:undefined',
	]);
});

test('marks are exported as colours, data attributes and hovers', async () => {
	let versions = seed(() => $getRoot().append(heading(), paragraph('Hello World')));

	versions = await edit(versions, 'bob', () => {
		const [title, body] = children();
		title.setTag('h3');
		const [hello, , world] = body.getFirstChild().splitText(2, 6);
		hello.toggleFormat('bold');
		world.remove();
		body.append($createTextNode('there'));
	});

	const { older, newer } = compare(versions, 0, 1);

	const marked = (html: string) => {
		const container = document.createElement('div');
		container.innerHTML = html;

		return {
			container,
			marks: [...container.querySelectorAll<HTMLElement>('[data-diff]')].map((element) => [
				element.tagName,
				element.dataset.diff,
				element.dataset.diffBy,
				element.dataset.diffAt,
			]),
		};
	};

	expect(marked(older.html).marks).toEqual([
		['H2', 'change', 'bob', '2000'],
		['P', 'change', 'bob', '2000'],
		['SPAN', 'change', 'bob', '2000'],
		['SPAN', 'delete', 'bob', '2000'],
	]);
	expect(marked(newer.html).marks).toEqual([
		['H3', 'change', 'bob', '2000'],
		['P', 'change', 'bob', '2000'],
		['B', 'change', 'bob', '2000'],
		['SPAN', 'insert', 'bob', '2000'],
	]);

	const { container } = marked(newer.html);

	expect(container.querySelector('[id]')).toBeNull();
	expect(container.querySelector('h3 > span[title]')?.getAttribute('title')).toBe(
		'~ "tag" changed from "h2" to "h3".'
	);
	expect(container.querySelector('b')?.title).toBe('+ "bold" added with the value true.');
});
