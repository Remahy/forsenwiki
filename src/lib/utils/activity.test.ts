import { expect, test } from 'vitest';

import type { ActivityEntry } from '$lib/db/activity/read';
import { createActivityParams, activityMatchesFilters, getActivityFilters } from './activity';

const activity = (type: string, name: string, children: string[] = []) =>
	({
		type,
		user: { id: name, name },
		children: children.map((type) => ({ type })),
	}) as ActivityEntry;

test('filters survive a round trip through the URL, unknown types are dropped', () => {
	const params = createActivityParams({
		authors: ['forsen', 'nani'],
		types: ['ARTICLE_RENAME', 'NOT_A_TYPE'],
		limit: 30,
	});

	expect(getActivityFilters(params)).toEqual({
		cursor: null,
		authors: ['forsen', 'nani'],
		types: ['ARTICLE_RENAME'],
		limit: 30,
	});
});

test('an activity matches a type filter through the ones linked to it too', () => {
	const update = activity('ARTICLE_UPDATE', 'forsen', ['ARTICLE_RENAME']);

	expect(activityMatchesFilters(update, { authors: [], types: [] })).toBe(true);
	expect(activityMatchesFilters(update, { authors: [], types: ['ARTICLE_RENAME'] })).toBe(true);
	expect(activityMatchesFilters(update, { authors: [], types: ['USER_REGISTER'] })).toBe(false);
	expect(activityMatchesFilters(update, { authors: ['nani'], types: [] })).toBe(false);
	expect(activityMatchesFilters(update, { authors: ['forsen'], types: ['ARTICLE_UPDATE'] })).toBe(
		true
	);
});
