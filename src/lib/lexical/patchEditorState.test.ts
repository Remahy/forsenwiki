import { expect, test } from 'vitest';
import {
	$createParagraphNode,
	$createTextNode,
	$getEditor,
	$getRoot,
	$isElementNode,
	type ElementNode,
} from 'lexical';
import { $createLinkNode } from '@lexical/link';
import { $createListItemNode, $createListNode } from '@lexical/list';
import { $createHeadingNode } from '@lexical/rich-text';
import { $createTableNodeWithDimensions } from '@lexical/table';

import { articleExtension } from '$lib/components/editor/config/article';
import { EDITOR_IS_READONLY } from '$lib/constants/constants';
import { getYAndEditor, readState, seedState } from '$lib/y/headless';
import {
	diffUpdateUsingStateVectorV2,
	getStateVectorFromUpdateV2,
	mergePostUpdatesV2,
} from '$lib/y/utils';
import { $patchEditorState, sameContent } from './patchEditorState';

const config = () => articleExtension(null, EDITOR_IS_READONLY, null);

const $json = () => $getEditor().getEditorState().toJSON();

const $paragraph = (text: string) => $createParagraphNode().append($createTextNode(text));

const $blocks = () =>
	$getRoot()
		.getChildren()
		.map((node) => node.getTextContent());

const $block = (index: number) => {
	const block = $getRoot().getChildAtIndex(index);
	if (!$isElementNode(block)) {
		throw new Error(`No block at ${index}.`);
	}
	return block;
};

const $firstTextOf = (element: ElementNode) => element.getAllTextNodes()[0];

const $fillLastCell = () => {
	const table = $block(4);
	const cell = table.getLastDescendant()?.getParentOrThrow();
	if (!$isElementNode(cell)) {
		throw new Error('Expected the table to end with a cell.');
	}
	cell.clear().append($createTextNode('cell'));
};

/** Patches an article holding `$before` into `$after`, and returns what that wrote. */
const patch = async ($before: () => void, $after: () => void) => {
	const base = seedState(config(), $before);
	const after = readState(config(), seedState(config(), $after), $json);

	const article = getYAndEditor(config(), base);
	const before = article.editor.getEditorState().toJSON();
	article.editor.update(() => $patchEditorState(before, after), { discrete: true });

	const patched = article.editor.getEditorState().toJSON();
	const state = await article.encodeV2();
	article.dispose();

	return {
		base,
		before,
		after,
		patched,
		stored: readState(config(), state, $json),
		update: diffUpdateUsingStateVectorV2(state, getStateVectorFromUpdateV2(base)),
	};
};

/** What `base` reads as after someone else's `$edit`, with `update` merged in. */
const mergedWith = async (base: Uint8Array, update: Uint8Array, $edit: () => void) => {
	const other = getYAndEditor(config(), base);
	other.editor.update($edit, { discrete: true });
	const theirs = await other.encodeV2();
	other.dispose();

	return readState(config(), mergePostUpdatesV2([theirs, update] as never), $blocks);
};

const $article = () => {
	$getRoot().append(
		$createHeadingNode('h2').append($createTextNode('Title')),
		$paragraph('first paragraph stays the same'),
		$paragraph('second paragraph has some words in it'),
		$createListNode('bullet').append(
			$createListItemNode().append($createTextNode('one')),
			$createListItemNode().append($createTextNode('two'))
		),
		$createTableNodeWithDimensions(2, 2, false),
		$paragraph('last paragraph')
	);
};

test.each<[string, () => void]>([
	[
		'changed text',
		() => $firstTextOf($block(2)).setTextContent('second paragraph has other words'),
	],
	['changed format', () => $firstTextOf($block(1)).toggleFormat('bold')],
	[
		'partly formatted text',
		() => {
			const [, bold] = $firstTextOf($block(1)).splitText(6, 15);
			bold.toggleFormat('italic');
		},
	],
	['an added block', () => $block(1).insertAfter($paragraph('added'))],
	['a removed block', () => $block(2).remove()],
	['every block removed', () => $getRoot().clear()],
	['a block of another type', () => $block(1).replace($createHeadingNode('h3'), true)],
	['a changed heading level', () => $block(0).replace($createHeadingNode('h4'), true)],
	[
		'a moved block',
		() => {
			const moved = $block(1);
			moved.remove();
			$getRoot().append(moved);
		},
	],
	[
		'a link around text',
		() => {
			const [, linked] = $firstTextOf($block(2)).splitText(7, 16);
			linked.replace($createLinkNode('https://example.com').append($createTextNode('paragraph')));
		},
	],
	[
		'list items',
		() => {
			$firstTextOf($block(3)).setTextContent('uno');
			$block(3).append($createListItemNode().append($createTextNode('three')));
		},
	],
	['a filled table cell', () => $fillLastCell()],
	[
		'several changes',
		() => {
			$block(5).remove();
			$firstTextOf($block(2)).setTextContent('second');
			$block(0).insertBefore($paragraph('new start'));
			$getRoot().append($paragraph('new end'));
		},
	],
])('patches %s', async (_name, $change) => {
	const { after, patched, stored } = await patch($article, () => {
		$article();
		$change();
	});

	expect(sameContent(patched, after)).toBe(true);
	expect(sameContent(stored, after)).toBe(true);
});

test('nothing is written when nothing differs', async () => {
	const { update, base } = await patch($article, $article);

	expect(mergePostUpdatesV2([base, update] as never).byteLength).toBe(base.byteLength);
});

test('a patch only writes what differs', async () => {
	const { update, base } = await patch($article, () => {
		$article();
		$firstTextOf($block(2)).setTextContent('second paragraph has other words in it');
	});

	expect(update.byteLength).toBeLessThan(base.byteLength / 4);
});

test("a patch merges with someone else's edits of the same article", async () => {
	const $before = () => {
		$getRoot().append(
			$paragraph('first paragraph stays the same'),
			$paragraph('second paragraph has some words in it'),
			$paragraph('third paragraph is also here'),
			$paragraph('fourth one')
		);
	};

	const { base, update } = await patch($before, () => {
		$getRoot().append(
			$paragraph('first paragraph stays the same'),
			$paragraph('added by the patch'),
			$paragraph('second paragraph has CHANGED words in it'),
			$paragraph('third paragraph is also here')
		);
	});

	const merged = await mergedWith(base, update, () => {
		$firstTextOf($block(1)).setTextContent('second paragraph has some words in it PLUS TAIL');
		$firstTextOf($block(2)).setTextContent('third paragraph is also here, EDITED BY OTHERS');
		$getRoot().append($paragraph('others appended'));
	});

	expect(merged).toEqual([
		'first paragraph stays the same',
		'added by the patch',
		'second paragraph has CHANGED words in it PLUS TAIL',
		'third paragraph is also here, EDITED BY OTHERS',
		'others appended',
	]);
});
