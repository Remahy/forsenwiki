import { beforeEach, expect, test, vi } from 'vitest';

import { articleMatches, editorMatches, rowsAfter } from '$lib/db/search/conditions';
import { _getSearch } from './+server';

const articles = vi.hoisted(() => [] as unknown[]);

const contents = vi.hoisted(() => [] as unknown[]);

const calls = vi.hoisted(() => [] as Array<{ model: string; args: Record<string, any> }>);

vi.mock('$lib/prisma.server', () => {
	const model = (name: string, rows: unknown[]) => ({
		findMany: async (args: Record<string, unknown>) => {
			calls.push({ model: name, args });

			return rows;
		},
	});

	return { default: { yPost: model('yPost', articles), content: model('content', contents) } };
});

const article = (id: string, time: number) => ({
	id,
	rawTitle: id,
	title: id,
	html: null,
	createdTimestamp: new Date(time),
});

const content = (id: string, time: number) => ({
	id,
	type: 'image',
	name: id,
	hash: id,
	createdTimestamp: new Date(time),
});

beforeEach(() => {
	calls.length = 0;
	articles.length = 0;
	contents.length = 0;
});

test('every type continues after the last result, ordered by time and then id', async () => {
	const after = { createdTimestamp: new Date(1000), id: 'last' };

	await _getSearch('', [], { orderBy: 'desc', contentTypes: [], after });

	expect(calls.map(({ model }) => model)).toEqual(['yPost', 'content']);
	for (const { args } of calls) {
		expect(args).toMatchObject({
			orderBy: [{ createdTimestamp: 'desc' }, { id: 'desc' }],
			take: 50,
		});
		expect(args.skip).toBeUndefined();
		expect(args.where.AND).toContainEqual(rowsAfter('desc', after));
	}
});

test('all types make one page, newest first across articles and content', async () => {
	for (let index = 0; index < 50; index++) {
		articles.push(article(`article${index}`, 2 * index));
		contents.push(content(`content${index}`, 2 * index + 1));
	}
	articles.reverse();
	contents.reverse();

	const { results } = await _getSearch('', [], { orderBy: 'desc', contentTypes: [] });

	expect(results).toHaveLength(50);
	expect(results.map(({ createdTimestamp }) => createdTimestamp.getTime())).toEqual(
		Array.from({ length: 50 }, (_, index) => 99 - index)
	);
	expect(results[0]).toMatchObject({ id: 'content49', type: 'content' });
	expect(results[1]).toMatchObject({ id: 'article49' });
});

test('ties in time are broken by id, the same way the database pages them', async () => {
	articles.push(article('b', 0));
	contents.push(content('a', 0), content('c', 0));

	const { results } = await _getSearch('', [], { orderBy: 'asc', contentTypes: [] });

	expect(results.map(({ id }) => id)).toEqual(['a', 'b', 'c']);
});

test('articles found by title or by editor are one query, so one cannot come twice', async () => {
	await _getSearch('forsen', ['article'], { orderBy: 'desc', contentTypes: [] });

	expect(calls.map(({ model }) => model)).toEqual(['yPost']);
	expect(calls[0].args.where.AND).toContainEqual({
		OR: [articleMatches('forsen'), editorMatches('forsen')],
	});
});

test('content used by the articles found by title is found too', async () => {
	await _getSearch('forsen', [], { orderBy: 'desc', contentTypes: ['image'] });

	const contentSearch = calls.find(({ model }) => model === 'content');

	expect(contentSearch?.args.where.AND).toEqual(
		expect.arrayContaining([
			expect.objectContaining({
				OR: expect.arrayContaining([{ usedIn: { some: { post: articleMatches('forsen') } } }]),
			}),
			{ type: { in: ['image'] } },
		])
	);
});

test('listing everything does not look up where content is used', async () => {
	await _getSearch('', ['content'], { orderBy: 'desc', contentTypes: [] });

	expect(calls[0].args.include).toBeUndefined();
});

test('content found through articles says which, a few by name and how many', async () => {
	contents.push(
		{
			...content('image', 0),
			name: 'forsen.png',
			usedIn: [
				{ post: { title: 'forsen', rawTitle: 'Forsen' } },
				{ post: { title: 'forsen_games', rawTitle: 'Forsen Games' } },
			],
			_count: { usedIn: 5 },
		},
		{ ...content('named', 0), name: 'forsen2.png', usedIn: [], _count: { usedIn: 0 } }
	);

	const { results } = await _getSearch('forsen', ['content'], {
		orderBy: 'desc',
		contentTypes: [],
	});

	expect(results.map(({ id, usedIn }) => ({ id, usedIn }))).toEqual([
		{ id: 'named', usedIn: undefined },
		{
			id: 'image',
			usedIn: {
				articles: [
					{ title: 'forsen', rawTitle: 'Forsen' },
					{ title: 'forsen_games', rawTitle: 'Forsen Games' },
				],
				total: 5,
			},
		},
	]);
});
