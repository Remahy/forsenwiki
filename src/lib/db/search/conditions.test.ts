import { expect, test } from 'vitest';

import {
	PAGE_SIZE,
	articleMatches,
	contentMatches,
	contentTypeMatches,
	editorMatches,
	pageOf,
} from './conditions';

test('pages follow each other without gaps, and ties are broken by id in the same direction', () => {
	expect(pageOf('desc', 0)).toMatchObject({ skip: 0, take: PAGE_SIZE });
	expect(pageOf('desc', 3)).toMatchObject({ skip: 3 * PAGE_SIZE, take: PAGE_SIZE });

	expect(pageOf('asc', 0).orderBy).toEqual([{ createdTimestamp: 'asc' }, { id: 'asc' }]);
	expect(pageOf('desc', 0).orderBy).toEqual([{ createdTimestamp: 'desc' }, { id: 'desc' }]);
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
