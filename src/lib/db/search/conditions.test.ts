import { expect, test } from 'vitest';

import {
	articleMatches,
	contentMatches,
	contentTypeMatches,
	editorMatches,
	pageOrder,
	rowsAfter,
} from './conditions';

test('ties are broken by id in the same direction', () => {
	expect(pageOrder('asc')).toEqual([{ createdTimestamp: 'asc' }, { id: 'asc' }]);
	expect(pageOrder('desc')).toEqual([{ createdTimestamp: 'desc' }, { id: 'desc' }]);
});

test('a page continues with the rows after the last one, ties included', () => {
	const createdTimestamp = new Date(1000);

	expect(rowsAfter('desc', null)).toEqual({});
	expect(rowsAfter('desc', { createdTimestamp, id: 'b' })).toEqual({
		OR: [{ createdTimestamp: { lt: createdTimestamp } }, { createdTimestamp, id: { lt: 'b' } }],
	});
	expect(rowsAfter('asc', { createdTimestamp, id: 'b' })).toEqual({
		OR: [{ createdTimestamp: { gt: createdTimestamp } }, { createdTimestamp, id: { gt: 'b' } }],
	});
});

test('articles match their title or display title in any case, or their exact id', () => {
	expect(articleMatches('Forsen').OR).toEqual(
		expect.arrayContaining([
			{ rawTitle: { contains: 'Forsen', mode: 'insensitive' } },
			{ title: { contains: 'Forsen', mode: 'insensitive' } },
			{ id: { equals: 'Forsen' } },
		])
	);
});

test('editors are matched by their username or id, lowercased', () => {
	expect(editorMatches('Forsen')).toEqual({
		postUpdates: {
			some: { metadata: { OR: [{ user: { name: 'forsen' } }, { user: { id: 'forsen' } }] } },
		},
	});
});

test('content matches by uploader, name or hash, or through the articles found by title', () => {
	expect(contentMatches('Forsen').OR).toEqual(
		expect.arrayContaining([
			{ author: { name: 'forsen' } },
			{ author: { id: 'forsen' } },
			{ name: { contains: 'forsen', mode: 'insensitive' } },
			{ hash: { equals: 'forsen' } },
			{ usedIn: { some: { post: articleMatches('Forsen') } } },
		])
	);
});

test('no content types is every type, otherwise only those', () => {
	expect(contentTypeMatches([])).toEqual({ type: undefined });
	expect(contentTypeMatches(['image', 'link'])).toEqual({ type: { in: ['image', 'link'] } });
});
