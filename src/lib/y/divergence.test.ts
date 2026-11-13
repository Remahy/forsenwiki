// Records current behaviour: the "garbles" and "loses" cases are not wanted.
import { expect, test } from 'vitest';
import { $createTextNode, $getRoot, $isElementNode } from 'lexical';
import { $createListItemNode, $createListNode } from '@lexical/list';
import { $createHeadingNode } from '@lexical/rich-text';

import { $paragraph, config, edited, legacyEdit, read } from '$lib/yjs/legacy.fixtures';
import { convertLegacyUpdate, migrateLegacyChanges } from '$lib/yjs/migrateLegacy';
import { seedState } from './headless';

const HEADING = 'Heading';
const FIRST = 'The first paragraph has several words in it.';
const SECOND = 'The second paragraph has several words too.';
const LIST = 'First item\n\nSecond item';
const LAST = 'The last paragraph.';

const $article = () => {
	$getRoot().append(
		$createHeadingNode('h2').append($createTextNode(HEADING)),
		$paragraph(FIRST),
		$paragraph(SECOND),
		$createListNode('bullet').append(
			$createListItemNode().append($createTextNode('First item')),
			$createListItemNode().append($createTextNode('Second item'))
		),
		$paragraph(LAST)
	);
};

const $block = (index: number) => {
	const block = $getRoot().getChildAtIndex(index);
	if (!$isElementNode(block)) {
		throw new Error(`No block at ${index}.`);
	}
	return block;
};

const $retype = (index: number, text: string) =>
	$block(index).getAllTextNodes()[0].setTextContent(text);

const $addItem = (text: string) =>
	$block(3).append($createListItemNode().append($createTextNode(text)));

type Case = {
	one: () => void;
	other: () => void;
	merged: string[];
	/** Which edit goes first is random. */
	orMerged?: string[];
	migrated?: string[];
};

const keepsBoth: Record<string, Case> = {
	'different words of the same paragraph': {
		one: () => $retype(1, 'The first paragraph has many words in it.'),
		other: () => $retype(1, 'The first section has several words in it.'),
		merged: [HEADING, 'The first section has many words in it.', SECOND, LIST, LAST],
	},
	'a paragraph added at the same place by both': {
		one: () => $block(2).insertAfter($paragraph('Added by one user.')),
		other: () => $block(2).insertAfter($paragraph('Added by the other user.')),
		merged: [HEADING, FIRST, SECOND, 'Added by one user.', 'Added by the other user.', LIST, LAST],
		orMerged: [
			HEADING,
			FIRST,
			SECOND,
			'Added by the other user.',
			'Added by one user.',
			LIST,
			LAST,
		],
	},
	'an item added to the same list by both': {
		one: () => $addItem('Item of one user'),
		other: () => $addItem('Item of the other user'),
		merged: [HEADING, FIRST, SECOND, `${LIST}\n\nItem of one user\n\nItem of the other user`, LAST],
		orMerged: [
			HEADING,
			FIRST,
			SECOND,
			`${LIST}\n\nItem of the other user\n\nItem of one user`,
			LAST,
		],
	},
	'blocks one removed and another block the other edited': {
		one: () => {
			$block(0).remove();
			$block(0).remove();
		},
		other: () => $retype(2, 'The second paragraph has several more words too.'),
		merged: ['The second paragraph has several more words too.', LIST, LAST],
	},
	'many changes in different places': {
		one: () => {
			$retype(0, 'Changed heading');
			$retype(1, 'The first paragraph has fewer words.');
			$block(1).insertAfter($paragraph('Added by one user.'));
		},
		other: () => {
			$addItem('Item of the other user');
			$retype(4, 'The last paragraph, edited.');
			$getRoot().append($paragraph('Added by the other user.'));
		},
		merged: [
			'Changed heading',
			'The first paragraph has fewer words.',
			'Added by one user.',
			SECOND,
			`${LIST}\n\nItem of the other user`,
			'The last paragraph, edited.',
			'Added by the other user.',
		],
	},
	'a paragraph one made a heading and the other edited': {
		one: () => $block(4).replace($createHeadingNode('h3'), true),
		other: () => $retype(4, 'The last edited paragraph.'),
		merged: [HEADING, FIRST, SECOND, LIST, 'The last edited paragraph.'],
		// The migrated draft replaces the block, so the other's word lands in front of it.
		migrated: [HEADING, FIRST, SECOND, LIST, 'edited The last paragraph.'],
	},
};

const garbles: Record<string, Case> = {
	'the same paragraph rewritten by both: the two rewrites are interleaved': {
		one: () => $retype(1, 'One user rewrote this whole paragraph their own way.'),
		other: () => $retype(1, 'Another user replaced it with different text altogether.'),
		merged: [
			HEADING,
			'One user rewrote this wholeAnother user replaced it with different text altogether.their own way.',
			SECOND,
			LIST,
			LAST,
		],
		orMerged: [
			HEADING,
			'One user rewrote this wholetheir own way.Another user replaced it with different text altogether.',
			SECOND,
			LIST,
			LAST,
		],
	},
	"a paragraph one removed and the other edited: the edit's words end up in the next block": {
		one: () => $block(2).remove(),
		other: () => $retype(2, 'The second paragraph has several more words too.'),
		merged: [HEADING, FIRST, `more ${LIST}`, LAST],
	},
	"a paragraph one moved and the other edited: the edit's words end up in the next block": {
		one: () => {
			const moved = $block(1);
			moved.remove();
			$getRoot().append(moved);
		},
		other: () => $retype(1, 'The first paragraph has several new words in it.'),
		merged: [HEADING, `new ${SECOND}`, LIST, LAST, FIRST],
	},
	"an article one replaced whole and the other edited: the edit's words end up in the replacement":
		{
			one: () => {
				$getRoot().clear();
				$getRoot().append($paragraph('One user replaced the whole article.'));
			},
			other: () => {
				$retype(1, 'The first paragraph has fewer words.');
				$getRoot().append($paragraph('Added by the other user.'));
			},
			merged: ['fewer words.One user replaced the whole article.', 'Added by the other user.'],
		},
};

const loses: Record<string, Case> = {
	'a list one removed and the other added an item to: only the new item is left': {
		one: () => $block(3).remove(),
		other: () => $addItem('Item of the other user'),
		merged: [HEADING, FIRST, SECOND, 'Item of the other user', LAST],
	},
};

const cases = (group: Record<string, Case>) => Object.entries(group);

const mergeEdits = async ({ one, other }: Case) => {
	const base = seedState(config(), $article);
	const theirs = await edited(base, one);
	const mine = await edited(base, other);

	return { merged: read(theirs, mine), reversed: read(mine, theirs) };
};

const mergeMigratedDraft = async ({ one, other }: Case) => {
	const legacy = legacyEdit($article);
	const base = convertLegacyUpdate(legacy);
	const current = await edited(base, other);
	const update = await migrateLegacyChanges({
		legacyArticle: legacy,
		legacyUpdate: legacyEdit(one, legacy),
		base,
	});

	return read(current, update as Uint8Array);
};

const outcomes = ({ merged, orMerged }: Case) => (orMerged ? [merged, orMerged] : [merged]);

test.each([
	['keep both', keepsBoth],
	['garble', garbles],
	['lose part of', loses],
] as const)('two edits made apart %s', async (_outcome, group) => {
	for (const [name, edits] of cases(group)) {
		const { merged, reversed } = await mergeEdits(edits);

		expect(outcomes(edits), name).toContainEqual(merged);
		expect(reversed, name).toEqual(merged);
	}
});

test('a migrated Yjs 13 draft merges like an edit made apart', async () => {
	for (const [name, edits] of cases({ ...keepsBoth, ...garbles, ...loses })) {
		const merged = await mergeMigratedDraft(edits);

		expect(edits.migrated ? [edits.migrated] : outcomes(edits), name).toContainEqual(merged);
	}
});
