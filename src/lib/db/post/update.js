import prisma from '$lib/prisma.server';
import { AVAILABLE_DISCLAIMER_TAGS, SYSTEM } from '$lib/constants/constants';
import { ACTIVITY_TYPES, FORCED_CONVERSION_EXPLANATION } from '$lib/constants/activity';
import { contentUploadActivities, createActivity } from '$lib/db/activity/create';
import { LEXICAL_Y } from '$lib/y/rows';
import { postYRelationDeleteByFromPostId } from './delete';

/**
 * @typedef {{ post: Pick<Prisma.YPost, 'id' | 'rawTitle' | 'title'>,
 *   outRelations: Omit<Prisma.YPostRelation, 'fromPostId'>[],
 *   disclaimerTags?: string[],
 *   metadata: { totalByteLength: number }
 * }} UpdateYPost
 */

/**
 * @param {Prisma.PrismaClient | Prisma.Prisma.TransactionClient} tx
 * @param {UpdateYPost} arg2
 * @returns {Promise<{ oldTags: string[], newTags: string[] } | null>}
 */
const updateYPost = async (tx, { post, outRelations, disclaimerTags, metadata }) => {
	await postYRelationDeleteByFromPostId(tx, post.id);

	/** @type {string[]} */
	let oldTags = [];

	if (disclaimerTags) {
		const current = await tx.yPostRelation.findMany({
			where: { fromPostId: post.id, isSystem: true, toPostId: { in: AVAILABLE_DISCLAIMER_TAGS } },
			select: { toPostId: true },
		});
		oldTags = current.map(({ toPostId }) => toPostId);

		await tx.yPostRelation.deleteMany({
			where: { fromPostId: post.id, isSystem: true, toPostId: { in: AVAILABLE_DISCLAIMER_TAGS } },
		});
	}

	const disclaimerTagRelations = (disclaimerTags ?? []).map((tag) => ({
		isSystem: true,
		toPostId: tag,
	}));

	await tx.yPost.update({
		where: {
			id: post.id,
		},
		data: {
			outRelations: {
				createMany: {
					data: [...disclaimerTagRelations, ...outRelations],
					skipDuplicates: true,
				},
			},
			totalByteLength: metadata.totalByteLength,
			lastUpdated: new Date(),
		},
	});

	if (!disclaimerTags) {
		return null;
	}

	const newTags = AVAILABLE_DISCLAIMER_TAGS.filter((tag) => disclaimerTags.includes(tag));
	const changed =
		newTags.length !== oldTags.length || newTags.some((tag) => !oldTags.includes(tag));

	return changed
		? { oldTags: AVAILABLE_DISCLAIMER_TAGS.filter((tag) => oldTags.includes(tag)), newTags }
		: null;
};

/**
 * Create YPostUpdateMetadata, & YPostUpdate
 * @param {Prisma.PrismaClient | Prisma.Prisma.TransactionClient} tx
 * @param {Pick<Prisma.YPostUpdate, 'content' | 'format' | 'postId'> & { createdTimestamp?: Date }} data
 * @param {{ user: { id: string }, byteLength: number, newTitle?: string, oldTitle?: string }} metadata
 */
const createYPostUpdate = async (tx, data, metadata) => {
	const { user, byteLength } = metadata;
	const row = await tx.yPostUpdateMetadata
		.create({
			data: {
				user: {
					connect: {
						id: user.id,
					},
				},
				byteLength,
				postUpdate: {
					create: {
						...data,
					},
				},
				newTitle: metadata.newTitle,
				oldTitle: metadata.oldTitle,
			},
		})
		.postUpdate({ select: { id: true, createdTimestamp: true, postId: true } });

	return /** @type {NonNullable<typeof row>} */ (row);
};

/**
 * @typedef {{ content: string, byteLength: number }} Seed
 * @typedef {{ post: Prisma.YPost, outRelations: Omit<Prisma.YPostRelation, 'fromPostId'>[], disclaimerTags?: string[], content: string, seed?: Seed, newImageHashes?: string[] }} UpdatePostData
 * @typedef {{ user: { id: string }, byteLength: number, totalByteLength: number, newTitle?: string, oldTitle?: string }} UpdatePostMetadata
 */

/**
 * @param {UpdatePostData} data
 * @param {UpdatePostMetadata} metadata
 */
export const updatePost = async (data, metadata) => {
	const { post, outRelations, disclaimerTags, content, seed, newImageHashes = [] } = data;

	return prisma.$transaction(async (tx) => {
		const tagChange = await updateYPost(tx, {
			post,
			outRelations,
			disclaimerTags,
			metadata,
		});

		/**
		 * @type {Pick<Prisma.YPostUpdate, 'content' | 'format' | 'postId'> & { createdTimestamp?: Date }}
		 */
		const dataToInsert = {
			content,
			format: LEXICAL_Y,
			postId: post.id,
		};

		/** @type {import('$lib/db/activity/create').ActivityData[]} */
		const childActivities = [];

		if (seed) {
			const seededAt = Date.now();

			// The row scripts/convertPostsToLexicalY.js writes.
			const seedRow = await createYPostUpdate(
				tx,
				{
					content: seed.content,
					format: LEXICAL_Y,
					postId: post.id,
					createdTimestamp: new Date(seededAt),
				},
				{ user: { id: SYSTEM }, byteLength: seed.byteLength }
			);

			childActivities.push({
				type: ACTIVITY_TYPES.ARTICLE_UPDATE,
				explanation: FORCED_CONVERSION_EXPLANATION,
				userId: SYSTEM,
				postId: post.id,
				postUpdateId: seedRow.id,
				createdTimestamp: seedRow.createdTimestamp,
			});

			// The user update receives a newer timestamp to make sure the seed is "before" in the database table.
			dataToInsert.createdTimestamp = new Date(seededAt + 1);
		}

		const row = await createYPostUpdate(tx, dataToInsert, metadata);

		const activity = {
			userId: metadata.user.id,
			postId: post.id,
			postUpdateId: row.id,
			createdTimestamp: row.createdTimestamp,
		};

		if (metadata.newTitle) {
			childActivities.push({ ...activity, type: ACTIVITY_TYPES.ARTICLE_RENAME });
		}

		if (tagChange) {
			childActivities.push({ ...activity, type: ACTIVITY_TYPES.ARTICLE_RETAG, ...tagChange });
		}

		if (newImageHashes.length) {
			const contents = await contentUploadActivities(tx, {
				authorId: metadata.user.id,
				hashes: newImageHashes,
			});

			childActivities.push(...contents);
		}

		await createActivity(tx, {
			...activity,
			type: ACTIVITY_TYPES.ARTICLE_UPDATE,
			children: childActivities,
		});

		return row;
	});
};

/**
 * @param {{ post: Prisma.YPost, newTitle: { sanitized: string, raw: string } }} data
 */
export const updatePostTitle = async (data) => {
	const { post, newTitle } = data;

	return prisma.yPost.update({
		where: {
			id: post.id,
		},
		data: {
			title: newTitle.sanitized,
			rawTitle: newTitle.raw,
		},
	});
};
