import prisma from '$lib/prisma.server';
import { AVAILABLE_DISCLAIMER_TAGS } from '$lib/constants/constants';
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
 */
const updateYPost = async (tx, { post, outRelations, disclaimerTags, metadata }) => {
	await postYRelationDeleteByFromPostId(tx, post.id);

	if (disclaimerTags) {
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
};

/**
 * Create YPostUpdateMetadata, & YPostUpdate
 * @param {Prisma.PrismaClient | Prisma.Prisma.TransactionClient} tx
 * @param {Pick<Prisma.YPostUpdate, 'content' | 'postId'>} data
 * @param {{ user: { id: string }, byteLength: number, newTitle?: string, oldTitle?: string }} metadata
 */
const createYPostUpdate = async (tx, data, metadata) => {
	const { user, byteLength } = metadata;
	return tx.yPostUpdateMetadata
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
};

/**
 * @typedef {{ post: Prisma.YPost, outRelations: Omit<Prisma.YPostRelation, 'fromPostId'>[], disclaimerTags?: string[], content: string }} UpdatePostData
 * @typedef {{ user: { id: string }, byteLength: number, totalByteLength: number, newTitle?: string, oldTitle?: string }} UpdatePostMetadata
 */

/**
 * @param {UpdatePostData} data
 * @param {UpdatePostMetadata} metadata
 */
export const updatePost = async (data, metadata) => {
	const { post, outRelations, disclaimerTags, content } = data;

	return prisma.$transaction(async (tx) => {
		await updateYPost(tx, {
			post,
			outRelations,
			disclaimerTags,
			metadata,
		});

		/**
		 * @type {Pick<Prisma.YPostUpdate, 'content' | 'postId'>}
		 */
		const dataToInsert = {
			content,
			postId: post.id,
		};

		return createYPostUpdate(tx, dataToInsert, metadata);
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
