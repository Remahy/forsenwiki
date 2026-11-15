import { beforeEach, expect, test, vi } from 'vitest';

import { SYSTEM } from '$lib/constants/constants';
import { FORCED_CONVERSION_EXPLANATION } from '$lib/constants/activity';
import { LEXICAL_Y } from '$lib/y/rows';
import { updatePost } from './update';

type Created = {
	user: { connect: { id: string } };
	byteLength: number;
	postUpdate: { create: { content: string; format: string; createdTimestamp?: Date } };
};

type CreatedActivity = {
	type: string;
	explanation?: string;
	userId: string;
	postUpdateId: string;
	children: { create: Omit<CreatedActivity, 'children'>[] };
};

const created = vi.hoisted(() => [] as Created[]);
const activities = vi.hoisted(() => [] as CreatedActivity[]);

vi.mock('$lib/prisma.server', () => {
	const tx = {
		yPostRelation: { deleteMany: vi.fn() },
		yPost: { update: vi.fn() },
		yPostUpdateMetadata: {
			create: ({ data }: { data: Created }) => {
				created.push(data);

				return { postUpdate: async () => ({ id: `row-${created.length}` }) };
			},
		},
		activity: {
			create: ({ data }: { data: CreatedActivity }) => {
				activities.push(data);

				return { id: `activity-${activities.length}` };
			},
		},
	};

	return { default: { $transaction: (run: (client: typeof tx) => unknown) => run(tx) } };
});

const post = { id: 'post', title: 'article', rawTitle: 'Article' } as never;
const metadata = { user: { id: 'moderator' }, byteLength: 5, totalByteLength: 105 };

beforeEach(() => {
	created.length = 0;
	activities.length = 0;
});

test('an update of a converted article is one row', async () => {
	await updatePost({ post, outRelations: [], content: 'update' }, metadata);

	expect(created).toHaveLength(1);
	expect(created[0].user.connect.id).toBe('moderator');
	expect(created[0].postUpdate.create).toEqual({
		content: 'update',
		format: LEXICAL_Y,
		postId: 'post',
	});

	expect(activities).toHaveLength(1);
	expect(activities[0]).toMatchObject({
		type: 'ARTICLE_UPDATE',
		userId: 'moderator',
		postId: 'post',
		postUpdateId: 'row-1',
		children: { create: [] },
	});
});

test('a title change is an activity of its own, linked to the update', async () => {
	await updatePost(
		{ post, outRelations: [], content: 'update' },
		{ ...metadata, newTitle: 'Renamed', oldTitle: 'Article' }
	);

	expect(activities).toHaveLength(1);
	expect(activities[0].type).toBe('ARTICLE_UPDATE');
	expect(activities[0].children.create).toEqual([
		expect.objectContaining({ type: 'ARTICLE_RENAME', userId: 'moderator', postUpdateId: 'row-1' }),
	]);
});

test('a seed is stored first, by the system, and is older than the update built on it', async () => {
	const row = await updatePost(
		{ post, outRelations: [], content: 'update', seed: { content: 'seed', byteLength: 100 } },
		metadata
	);

	const [seed, update] = created;

	expect(created).toHaveLength(2);
	expect(seed.user.connect.id).toBe(SYSTEM);
	expect(seed.byteLength).toBe(100);
	expect(seed.postUpdate.create).toMatchObject({ content: 'seed', format: LEXICAL_Y });

	expect(update.user.connect.id).toBe('moderator');
	expect(update.postUpdate.create).toMatchObject({ content: 'update', format: LEXICAL_Y });
	expect(Number(seed.postUpdate.create.createdTimestamp)).toBeLessThan(
		Number(update.postUpdate.create.createdTimestamp)
	);

	expect(row).toEqual({ id: 'row-2' });

	expect(activities).toHaveLength(1);
	expect(activities[0]).toMatchObject({
		type: 'ARTICLE_UPDATE',
		userId: 'moderator',
		postUpdateId: 'row-2',
	});
	expect(activities[0].children.create).toEqual([
		expect.objectContaining({
			type: 'ARTICLE_UPDATE',
			explanation: FORCED_CONVERSION_EXPLANATION,
			userId: SYSTEM,
			postUpdateId: 'row-1',
		}),
	]);
});
