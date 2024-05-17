import prisma from "$lib/prisma";
import { Y_POST_TYPES } from "$lib/constants/yPostTypes";
import { postYRelationDeleteByFromPostId } from "./delete";

/**
 * @param {Prisma.PrismaClient | Prisma.Prisma.TransactionClient} tx
 * @param {{ post: Pick<Prisma.YPost, 'id'>, outRelations: Omit<Prisma.YPostRelation, 'fromPostId'>[], systemRelations: Omit<Prisma.YPostRelation, 'fromPostId'>[] }} arg2
 */
export const updateEntity = async (tx, { post, outRelations, systemRelations }) => {
	await postYRelationDeleteByFromPostId(tx, post.id)

	await tx.yPost.update({
		where: {
			id: post.id
		},
		data: {
			outRelations: {
				createMany: {
					data: [
						{
							isSystem: true,
							toPostId: Y_POST_TYPES.ARTICLE
						},
						...systemRelations,
						...outRelations
					],
					skipDuplicates: true
				}
			},
			lastUpdated: new Date()
		}
	})
}

/**
 * @param {{ userId: string }} arg1
 * @param {{ post: Prisma.YPost, outRelations: Omit<Prisma.YPostRelation, 'fromPostId'>[], transformedSystemRelations: Omit<Prisma.YPostRelation, 'fromPostId'>[], content: string }} data
 */
export const updateArticleYPost = async ({ userId }, data) => {
	const { post, outRelations, transformedSystemRelations, content } = data

	return prisma.$transaction(async (tx) => {
		await updateEntity(tx, {
			post,
			outRelations,
			systemRelations: transformedSystemRelations
		})

		/**
			* @type {Pick<Prisma.YPostUpdate, 'content' | 'postId'>}
			*/
		const dataToInsert = {
			content,
			postId: post.id
		}

		return createYPostUpdate(tx, userId, dataToInsert)
	})
}


/**
 * Create YPostUpdateMetadata, & YPostUpdate
 * @param {Prisma.PrismaClient | Prisma.Prisma.TransactionClient} tx
 * @param {string} userId
 * @param {Pick<Prisma.YPostUpdate, 'content' | 'postId'>} data
 */
export const createYPostUpdate = async (tx, userId, data) => {
	return tx.yPostUpdateMetadata.create({
		data: {
			user: {
				connect: {
					id: userId
				}
			},
			postUpdate: {
				create: {
					...data
				}
			}
		}
	}).postUpdate({ select: { id: true, createdTimestamp: true, postId: true } })
}