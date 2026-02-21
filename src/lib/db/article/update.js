import prisma from '$lib/prisma';
import { Y_POST_TYPES } from '$lib/constants/constants';
import { postYRelationDeleteByFromPostId } from './delete';

/**
 * @typedef {{ post: Pick<Prisma.YPost, 'id' | 'rawTitle' | 'title'>,
 *   outRelations: Omit<Prisma.YPostRelation, 'fromPostId'>[],
 *   systemRelations: Omit<Prisma.YPostRelation, 'fromPostId'>[],
 *   metadata: { totalByteLength: number }
 * }} UpdateYPost
 */

/**
 * @param {Prisma.PrismaClient | Prisma.Prisma.TransactionClient} tx
 * @param {UpdateYPost} arg2
 */
const updateYPost = async (tx, { post, outRelations, systemRelations, metadata }) => {
	await postYRelationDeleteByFromPostId(tx, post.id);

	await tx.yPost.update({
		where: {
			id: post.id,
		},
		data: {
			outRelations: {
				createMany: {
					data: [
						{
							isSystem: true,
							toPostId: Y_POST_TYPES.ARTICLE,
						},
						...systemRelations,
						...outRelations,
					],
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
 * @param {{ post: Prisma.YPost, outRelations: Omit<Prisma.YPostRelation, 'fromPostId'>[], transformedSystemRelations: Omit<Prisma.YPostRelation, 'fromPostId'>[], content: string }} data
 * @param {{ user: { id: string }, byteLength: number, totalByteLength: number, newTitle?: string, oldTitle?: string }} metadata
 */
export const updateArticleYPost = async (data, metadata) => {
	const { post, outRelations, transformedSystemRelations, content } = data;

	return prisma.$transaction(async (tx) => {
		await updateYPost(tx, {
			post,
			outRelations,
			systemRelations: transformedSystemRelations,
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
export const updateArticleTitle = async (data) => {
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
