import { createHash } from 'node:crypto';
import { beforeEach, expect, test, vi } from 'vitest';

import { SYSTEM } from '$lib/constants/constants';
import {
	FORCED_CONVERSION_EXPLANATION,
	MISSING_ARTICLE_LINKS_EXPLANATION,
} from '$lib/constants/activity';
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
const currentTags = vi.hoisted(() => [] as string[]);

type Usage = { postId: string; contentId: string; postUpdateId?: string; createdTimestamp: Date };

const usages = vi.hoisted(() => [] as Usage[]);

type LinkContent = { hash: string; name: string; type: string; authorId: string };

const linkContents = vi.hoisted(() => [] as LinkContent[]);

vi.mock('$lib/prisma.server', () => {
	const tx = {
		yPostRelation: {
			deleteMany: vi.fn(),
			findMany: async () => currentTags.map((toPostId) => ({ toPostId })),
		},
		yPost: { update: vi.fn() },
		yPostUpdateMetadata: {
			create: ({ data }: { data: Created }) => {
				created.push(data);

				const n = created.length;

				return {
					postUpdate: async () => ({ id: `row-${n}`, createdTimestamp: new Date(n * 1000) }),
				};
			},
		},
		content: {
			findMany: vi.fn(async ({ where }: { where: { hash: { in: string[] } } }) =>
				where.hash.in.map((hash) => ({
					id: `content-${hash}`,
					hash,
					createdTimestamp: new Date(0),
				}))
			),
			createMany: async ({ data }: { data: LinkContent[] }) => {
				linkContents.push(...data);
			},
		},
		yPostContent: {
			deleteMany: async ({
				where,
			}: {
				where: { postId: string; contentId: { notIn: string[] } };
			}) => {
				const kept = usages.filter(
					(u) => u.postId !== where.postId || where.contentId.notIn.includes(u.contentId)
				);
				usages.splice(0, usages.length, ...kept);
			},
			createMany: async ({ data }: { data: Usage[] }) => {
				for (const usage of data) {
					const exists = usages.some(
						(u) => u.postId === usage.postId && u.contentId === usage.contentId
					);

					if (!exists) {
						usages.push(usage);
					}
				}
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

const lastUpdated = new Date(500);
const post = { id: 'post', title: 'article', rawTitle: 'Article', lastUpdated } as never;
const metadata = { user: { id: 'moderator' }, byteLength: 5, totalByteLength: 105 };

beforeEach(() => {
	created.length = 0;
	activities.length = 0;
	currentTags.length = 0;
	usages.length = 0;
	linkContents.length = 0;
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

	expect(row).toEqual({ id: 'row-2', createdTimestamp: new Date(2000) });

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

test('images new to the article are uploads linked to the update', async () => {
	await updatePost(
		{ post, outRelations: [], content: 'update', newImageHashes: ['a', 'b'] },
		metadata
	);

	expect(activities).toHaveLength(1);
	expect(activities[0].children.create).toEqual([
		{
			type: 'CONTENT_UPLOAD',
			userId: 'moderator',
			contentId: 'content-a',
			createdTimestamp: new Date(0),
		},
		{
			type: 'CONTENT_UPLOAD',
			userId: 'moderator',
			contentId: 'content-b',
			createdTimestamp: new Date(0),
		},
	]);
});

test('a change of disclaimer tags is an activity of its own, linked to the update', async () => {
	currentTags.push('satire');

	await updatePost(
		{ post, outRelations: [], content: 'update', disclaimerTags: ['nsfw', 'satire'] },
		metadata
	);

	expect(activities[0].children.create).toEqual([
		expect.objectContaining({
			type: 'ARTICLE_RETAG',
			userId: 'moderator',
			postUpdateId: 'row-1',
			oldTags: ['satire'],
			newTags: ['satire', 'nsfw'],
		}),
	]);
});

test('the same disclaimer tags, or none sent, are not a tag change', async () => {
	currentTags.push('satire', 'nsfw');

	await updatePost(
		{ post, outRelations: [], content: 'update', disclaimerTags: ['nsfw', 'satire'] },
		metadata
	);
	await updatePost({ post, outRelations: [], content: 'update' }, metadata);

	expect(activities.flatMap(({ children }) => children.create)).toEqual([]);
});

test('content in use keeps the update that added it, removed content is dropped', async () => {
	await updatePost(
		{ post, outRelations: [], content: 'update', contentHashes: ['a', 'b'] },
		metadata
	);
	await updatePost(
		{ post, outRelations: [], content: 'update', contentHashes: ['b', 'c'] },
		metadata
	);

	expect(usages).toEqual([
		{
			postId: 'post',
			contentId: 'content-b',
			postUpdateId: 'row-1',
			createdTimestamp: new Date(1000),
		},
		{
			postId: 'post',
			contentId: 'content-c',
			postUpdateId: 'row-2',
			createdTimestamp: new Date(2000),
		},
	]);
});

test('external links are content hashed by their URL, used by the article', async () => {
	await updatePost(
		{ post, outRelations: [], content: 'update', externalLinks: ['https://x.com/forsen'] },
		metadata
	);

	const hash = `link:${createHash('sha256').update('https://x.com/forsen').digest('hex')}`;

	expect(linkContents).toEqual([
		{
			hash,
			name: 'https://x.com/forsen',
			type: 'link',
			authorId: 'moderator',
		},
	]);
	expect(usages).toEqual([
		{
			postId: 'post',
			contentId: `content-${hash}`,
			postUpdateId: 'row-1',
			createdTimestamp: new Date(1000),
		},
	]);
});

test('an update submitted again with links to missing articles says so, others say nothing', async () => {
	await updatePost(
		{ post, outRelations: [], content: 'update', missingArticles: ['deleted'] },
		metadata
	);
	await updatePost({ post, outRelations: [], content: 'update' }, metadata);

	expect(activities.map(({ type, explanation }) => ({ type, explanation }))).toEqual([
		{ type: 'ARTICLE_UPDATE', explanation: MISSING_ARTICLE_LINKS_EXPLANATION },
		{ type: 'ARTICLE_UPDATE', explanation: undefined },
	]);
});
