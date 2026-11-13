import { expect, test } from 'vitest';
import { $createParagraphNode, $createTextNode, $getRoot, $isTextNode } from 'lexical';
import { $createLinkNode } from '@lexical/link';
import { $createTableNodeWithDimensions } from '@lexical/table';

import { isLegacyUpdate, readState, seedFromJSON } from '$lib/y/headless';
import { conversionDifferences, convertLegacyArticle } from './convertLegacy';
import { legacyUpdateToJSON } from './legacyUpdateToJSON';
import { convertLegacyUpdate, migrateLegacyChanges } from './migrateLegacy';
import { $paragraph, config, edited, legacyEdit, read } from './legacy.fixtures';

const $article = () => {
	$getRoot().append(
		$createParagraphNode().append(
			$createTextNode('see '),
			$createLinkNode('https://example.com').append($createTextNode('the docs'))
		),
		$createTableNodeWithDimensions(1, 2, false)
	);
};

const legacyArticle = () => legacyEdit($article);

const $firstText = () => {
	const [text] = $getRoot().getAllTextNodes();
	if (!$isTextNode(text)) {
		throw new Error('Expected the article to hold text.');
	}
	return text;
};

test('a Yjs 13 article converts to Lexical JSON', () => {
	const json = legacyUpdateToJSON(legacyArticle());

	expect(json.root.children.map(({ type }) => type)).toEqual(['paragraph', 'a-table']);
});

test('a Yjs 13 article seeds a Yjs 14 document with the same content', () => {
	const seed = convertLegacyUpdate(legacyArticle());

	const text = readState(config(), seed, () => $getRoot().getTextContent());
	expect(text).toBe('see the docs\n\n\n\n');
	expect(readState(config(), seed, () => $getRoot().getChildrenSize())).toBe(2);
});

test('an update from the Yjs 13 editor is recognised, also once its content is deleted', () => {
	expect(isLegacyUpdate(legacyArticle())).toBe(true);
	expect(isLegacyUpdate(legacyEdit(() => $getRoot().clear(), legacyArticle()))).toBe(true);
});

test('updates from the @lexical/y editor are not taken for Yjs 13 ones', async () => {
	const article = convertLegacyUpdate(legacyArticle());

	expect(isLegacyUpdate(article)).toBe(false);
	expect(isLegacyUpdate(await edited(article, () => $firstText().setTextContent('read ')))).toBe(
		false
	);
	expect(isLegacyUpdate(await edited(article, () => $getRoot().clear()))).toBe(false);
});

test('a Yjs 13 draft without changes of its own migrates nothing', async () => {
	const legacy = legacyArticle();
	const base = convertLegacyUpdate(legacy);

	expect(await migrateLegacyChanges({ legacyArticle: legacy, legacyUpdate: legacy, base })).toBe(
		null
	);
});

test('a Yjs 13 draft of an older version of the article migrates nothing', async () => {
	const draft = legacyArticle();
	const legacy = legacyEdit(() => $getRoot().append($paragraph('added later')), draft);
	const base = convertLegacyUpdate(legacy);

	expect(await migrateLegacyChanges({ legacyArticle: legacy, legacyUpdate: draft, base })).toBe(
		null
	);
});

test('the changes of a Yjs 13 draft are migrated', async () => {
	const legacy = legacyArticle();
	const base = convertLegacyUpdate(legacy);
	const draft = legacyEdit(() => {
		$firstText().setTextContent('look at ');
		$getRoot().append($paragraph('my unsaved paragraph'));
	}, legacy);

	const update = await migrateLegacyChanges({ legacyArticle: legacy, legacyUpdate: draft, base });

	expect(update).not.toBe(null);
	expect(isLegacyUpdate(update as Uint8Array)).toBe(false);
	expect(read(base, update as Uint8Array)).toEqual([
		'look at the docs',
		'',
		'my unsaved paragraph',
	]);
});

test('a Yjs 13 draft is merged with what the article got after the draft was started', async () => {
	const started = legacyArticle();
	const draft = legacyEdit(() => $getRoot().append($paragraph('my unsaved paragraph')), started);
	const legacy = legacyEdit(() => $firstText().setTextContent('go see '), started);
	const base = convertLegacyUpdate(legacy);

	const update = await migrateLegacyChanges({ legacyArticle: legacy, legacyUpdate: draft, base });

	expect(read(base, update as Uint8Array)).toEqual(['go see the docs', '', 'my unsaved paragraph']);
});

test('a migrated Yjs 13 draft merges with the edits made since the conversion', async () => {
	const legacy = legacyArticle();
	const base = convertLegacyUpdate(legacy);
	const draft = legacyEdit(() => $getRoot().append($paragraph('my unsaved paragraph')), legacy);
	const current = await edited(base, () => {
		$firstText().setTextContent('everyone should see ');
		$getRoot().getFirstChildOrThrow().insertBefore($paragraph('their new intro'));
	});

	const update = await migrateLegacyChanges({ legacyArticle: legacy, legacyUpdate: draft, base });

	expect(read(current, update as Uint8Array)).toEqual([
		'their new intro',
		'everyone should see the docs',
		'',
		'my unsaved paragraph',
	]);
});

test('a Yjs 13 draft of a new article replaces the content the article starts with', async () => {
	const base = seedFromJSON(
		config(),
		legacyUpdateToJSON(legacyEdit(() => $getRoot().append($paragraph('forsen'))))
	);
	const draft = legacyEdit(() => $getRoot().append($paragraph('my new article')));

	const update = await migrateLegacyChanges({ legacyArticle: null, legacyUpdate: draft, base });

	expect(read(base, update as Uint8Array)).toEqual(['my new article']);
});

test('a converted article reads as the Yjs 13 article it was converted from', () => {
	const { update, differences } = convertLegacyArticle(legacyArticle());

	expect(differences).toEqual([]);
	expect(update).toEqual(convertLegacyUpdate(legacyArticle()));
});

test('what a conversion loses or changes is reported', () => {
	const before = legacyUpdateToJSON(legacyArticle());

	const retyped = structuredClone(before) as any;
	retyped.root.children[0].children[0].text = 'look at ';
	retyped.root.children[0].children[1].url = 'https://example.org';

	const shortened = structuredClone(before) as any;
	shortened.root.children.pop();

	expect(conversionDifferences(before as any, retyped)).toEqual([
		'/root[0]/paragraph[0]/text.text: "see " -> "look at "',
		'/root[0]/paragraph[1]/a-link.url: "https://example.com" -> "https://example.org"',
	]);
	expect(conversionDifferences(before as any, shortened)).toEqual(['/root: 2 -> 1 children']);
});

test('values the two editors only store differently are not differences', () => {
	const before = legacyUpdateToJSON(legacyArticle()) as any;
	before.root.direction = 'ltr';
	before.root.children[0].children[1].internalId = null;
	before.root.children[1].colWidths = ['50', ''];

	const after = structuredClone(before);
	after.root.direction = null;
	after.root.children[0].$ = { blockId: 'new' };
	after.root.children[0].children[1].internalId = '';
	after.root.children[1].colWidths = [50, 0];

	expect(conversionDifferences(before, after)).toEqual([]);
});
