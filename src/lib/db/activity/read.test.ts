import { beforeEach, expect, test, vi } from 'vitest';

import { readActivities, readActivitiesWhere } from './read';

const queries = vi.hoisted(() => [] as { where: Record<string, unknown> }[]);
const rows = vi.hoisted(() => [] as Record<string, unknown>[]);

vi.mock('$lib/prisma.server', () => ({
	default: {
		activity: {
			findMany: async (query: { where: Record<string, unknown> }) => {
				queries.push(query);

				return rows;
			},
		},
	},
}));

const filters = { authors: [], types: [], cursor: null, limit: 15 };
const hidden = { type: { notIn: ['USER_RENAME'] } };

beforeEach(() => {
	queries.length = 0;
	rows.length = 0;
});

const contentActivity = (id: string, content: object | null, contentSnapshot: object | null) => ({
	id,
	createdTimestamp: new Date('2026-11-22T00:00:00Z'),
	postUpdate: null,
	content,
	contentSnapshot,
	children: [],
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

test('content metadata is left out when it is empty, even for moderators', async () => {
	const file = {
		id: 'file',
		hash: 'a',
		name: 'a.png',
		contentLength: 6n,
		metadata: { userid: 'u' },
	};
	const link = { id: 'link', hash: 'link:b', name: 'https://b', contentLength: null, metadata: {} };
	rows.push(
		contentActivity('upload', file, null),
		contentActivity('link', link, null),
		contentActivity('deleted', null, { ...link, contentLength: null })
	);

	const [upload, linked, deleted] = await readActivities(filters, { isModerator: true });

	expect(upload.content).toHaveProperty('metadata', { userid: 'u' });
	expect(linked.content).not.toHaveProperty('metadata');
	expect(deleted.content).toMatchObject({ deleted: true });
	expect(deleted.content).not.toHaveProperty('metadata');

	const [asUser] = await readActivities(filters, { isModerator: false });
	expect(asUser.content).not.toHaveProperty('metadata');
});
