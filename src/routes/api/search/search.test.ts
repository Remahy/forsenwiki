import { beforeEach, expect, test, vi } from 'vitest';

import { _getSearch } from './+server';

const contents = vi.hoisted(() => [] as unknown[]);

const calls = vi.hoisted(() => [] as Array<{ model: string; args: Record<string, unknown> }>);

const article = vi.hoisted(() => ({
	id: 'article',
	rawTitle: 'forsen',
	title: 'forsen',
	html: null,
	createdTimestamp: new Date(0),
}));

vi.mock('$lib/prisma.server', () => {
	const model = (name: string, rows: unknown[]) => ({
		findMany: async (args: Record<string, unknown>) => {
			calls.push({ model: name, args });

			return rows;
		},
	});

	return { default: { yPost: model('yPost', [article]), content: model('content', contents) } };
});

beforeEach(() => {
	calls.length = 0;
	contents.length = 0;
});

test('pages are 50 rows apart, ordered by time and then id so ties keep their page', async () => {
	await _getSearch('', ['content'], { orderBy: 'desc', contentTypes: [], page: 2 });

	expect(calls[0].args).toMatchObject({
		orderBy: [{ createdTimestamp: 'desc' }, { id: 'desc' }],
		skip: 100,
		take: 50,
	});
});

test('an article found by title and by editor is one result', async () => {
	const { results } = await _getSearch('forsen', ['article'], {
		orderBy: 'desc',
		contentTypes: [],
		page: 0,
	});

	expect(calls.map(({ model }) => model)).toEqual(['yPost', 'yPost']);
	expect(results.map(({ id }) => id)).toEqual(['article']);
});

test('content used by the articles found by title is found too', async () => {
	await _getSearch('forsen', [], { orderBy: 'desc', contentTypes: ['image'], page: 0 });

	const [titleSearch] = calls.filter(({ model }) => model === 'yPost');
	const contentSearch = calls.find(({ model }) => model === 'content');

	expect(contentSearch?.args.where).toMatchObject({
		OR: expect.arrayContaining([{ usedIn: { some: { post: titleSearch.args.where } } }]),
		type: { in: ['image'] },
	});
});

test('content found through articles says which, a few by name and how many', async () => {
	contents.push(
		{
			id: 'image',
			type: 'image',
			name: 'forsen.png',
			hash: 'hash',
			createdTimestamp: new Date(0),
			usedIn: [
				{ post: { title: 'forsen', rawTitle: 'Forsen' } },
				{ post: { title: 'forsen_games', rawTitle: 'Forsen Games' } },
			],
			_count: { usedIn: 5 },
		},
		{
			id: 'named',
			type: 'image',
			name: 'forsen2.png',
			hash: 'hash2',
			createdTimestamp: new Date(0),
			usedIn: [],
			_count: { usedIn: 0 },
		}
	);

	const { results } = await _getSearch('forsen', ['content'], {
		orderBy: 'desc',
		contentTypes: [],
		page: 0,
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
