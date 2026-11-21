import { beforeEach, expect, test, vi } from 'vitest';

import { CONTENT_IN_USE, CONTENT_PROTECTED } from '$lib/constants/content';
import { WIKI_LINK_HASH } from '$lib/constants/content.server';
import { deleteContent } from './delete';

const content = {
	id: 'content',
	hash: 'hash',
	name: 'forsen.png',
	type: 'image',
	contentType: 'image/png',
	contentLength: 1234n,
	metadata: { userid: 'uploader' },
};

const state = vi.hoisted(() => ({
	hash: 'hash',
	usages: 0,
	recorded: 0,
	snapshots: [] as unknown[],
	activities: [] as Record<string, unknown>[],
	deleted: [] as string[],
}));

vi.mock('$lib/prisma.server', () => {
	const tx = {
		yPostContent: { count: async () => state.usages },
		content: {
			findUniqueOrThrow: async () => ({ ...content, hash: state.hash }),
			delete: async ({ where }: { where: { id: string } }) => state.deleted.push(where.id),
		},
		activity: {
			updateMany: async ({ data }: { data: { contentSnapshot: unknown } }) => {
				if (state.recorded) {
					state.snapshots.push(data.contentSnapshot);
				}

				return { count: state.recorded };
			},
			create: async ({ data }: { data: Record<string, unknown> }) => {
				state.activities.push(data);

				return { id: 'delete-activity' };
			},
		},
	};

	return { default: { $transaction: (run: (client: typeof tx) => unknown) => run(tx) } };
});

beforeEach(() => {
	state.hash = 'hash';
	state.usages = 0;
	state.recorded = 0;
	state.snapshots.length = 0;
	state.activities.length = 0;
	state.deleted.length = 0;
});

test('deleting recorded content keeps what it was on its activities and records who deleted it', async () => {
	state.recorded = 1;

	const { activity } = await deleteContent('content', 'moderator');

	const snapshot = { ...content, contentLength: 1234 };

	expect(state.snapshots).toEqual([snapshot]);
	expect(state.activities).toEqual([
		{
			type: 'CONTENT_DELETE',
			userId: 'moderator',
			contentSnapshot: snapshot,
			children: { create: [] },
		},
	]);
	expect(activity).toEqual({ id: 'delete-activity' });
	expect(state.deleted).toEqual(['content']);
});

test('content no activity points to is deleted without one', async () => {
	const { activity } = await deleteContent('content', 'uploader');

	expect(activity).toBeNull();
	expect(state.activities).toEqual([]);
	expect(state.deleted).toEqual(['content']);
});

test('content an article uses is not deleted', async () => {
	state.usages = 2;

	await expect(deleteContent('content', 'moderator')).rejects.toMatchObject({
		code: CONTENT_IN_USE,
	});
	expect(state.activities).toEqual([]);
	expect(state.deleted).toEqual([]);
});

test('the link to the wiki is never deleted', async () => {
	state.hash = WIKI_LINK_HASH;

	await expect(deleteContent('content', 'moderator')).rejects.toMatchObject({
		code: CONTENT_PROTECTED,
	});
	expect(state.activities).toEqual([]);
	expect(state.deleted).toEqual([]);
});
