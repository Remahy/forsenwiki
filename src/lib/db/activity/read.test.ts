import { beforeEach, expect, test, vi } from 'vitest';

import { readActivities, readActivitiesWhere } from './read';

const queries = vi.hoisted(() => [] as { where: Record<string, unknown> }[]);

vi.mock('$lib/prisma.server', () => ({
	default: {
		activity: {
			findMany: async (query: { where: Record<string, unknown> }) => {
				queries.push(query);

				return [];
			},
		},
	},
}));

const filters = { authors: [], types: [], cursor: null, limit: 15 };
const hidden = { type: { notIn: ['USER_RENAME'] } };

beforeEach(() => {
	queries.length = 0;
});

test('username changes are left out for everyone but moderators', async () => {
	await readActivities(filters, { isModerator: false });
	await readActivities(filters, { isModerator: true });

	expect(queries[0].where).toMatchObject(hidden);
	expect(queries[1].where).not.toHaveProperty('type');
});

test('the live feed, read as a non-moderator, never carries a username change', async () => {
	await readActivitiesWhere({ id: 'activity' }, { isModerator: false });

	expect(queries[0].where).toEqual({ AND: [{ id: 'activity' }, hidden], parentId: null });
});
