import { beforeEach, expect, test, vi } from 'vitest';

import { _getSearch } from './+server';

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

	return { default: { yPost: model('yPost', [article]), content: model('content', []) } };
});

beforeEach(() => {
	calls.length = 0;
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
