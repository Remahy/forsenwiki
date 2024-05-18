import prisma from "$lib/prisma";
import { Y_POST_TYPES } from "$lib/constants/yPostTypes";
import { postYRelationDeleteByFromPostId } from "./delete";

/**
 * @param {Prisma.PrismaClient | Prisma.Prisma.TransactionClient} tx
 * @param {{ post: Pick<Prisma.YPost, 'id' | 'rawTitle' | 'title'>, outRelations: Omit<Prisma.YPostRelation, 'fromPostId'>[], systemRelations: Omit<Prisma.YPostRelation, 'fromPostId'>[] }} arg2
 * @param {{ name: string }} user
 */
export const updateEntity = async (tx, { post, outRelations, systemRelations }, user) => {
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
		},
		// @ts-ignore
		_metadata: {
			post,
			user,
		}
	})
}

/**
 * @param {{ post: Prisma.YPost, outRelations: Omit<Prisma.YPostRelation, 'fromPostId'>[], transformedSystemRelations: Omit<Prisma.YPostRelation, 'fromPostId'>[], content: string }} data
 * @param {{ name: string, id: string }} user
 */
export const updateArticleYPost = async (data, user) => {
	const { post, outRelations, transformedSystemRelations, content } = data

	return prisma.$transaction(async (tx) => {
		await updateEntity(tx, {
			post,
			outRelations,
			systemRelations: transformedSystemRelations
		}, user)

		/**
			* @type {Pick<Prisma.YPostUpdate, 'content' | 'postId'>}
			*/
		const dataToInsert = {
			content,
			postId: post.id
		}

		return createYPostUpdate(tx, dataToInsert, user)
	})
}


/**
 * Create YPostUpdateMetadata, & YPostUpdate
 * @param {Prisma.PrismaClient | Prisma.Prisma.TransactionClient} tx
 * @param {Pick<Prisma.YPostUpdate, 'content' | 'postId'>} data
 * @param {{ name: string, id: string }} user
 */
export const createYPostUpdate = async (tx, data, user) => {
	return tx.yPostUpdateMetadata.create({
		data: {
			user: {
				connect: {
					id: user.id
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