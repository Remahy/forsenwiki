import { ACTIVITY_TYPES } from '$lib/constants/activity';

/**
 * @typedef {{
 *   type: import('$lib/constants/activity').ActivityType,
 *   explanation?: string,
 *   userId?: string,
 *   postId?: string,
 *   postUpdateId?: string,
 *   contentId?: string,
 *   contentSnapshot?: import('$lib/db/content/delete').ContentSnapshot,
 *   oldName?: string,
 *   newName?: string,
 *   createdTimestamp?: Date,
 * }} ActivityData
 */

/**
 * @param {Prisma.PrismaClient | Prisma.Prisma.TransactionClient} tx
 * @param {ActivityData & { children?: ActivityData[] }} activity
 */
export const createActivity = async (tx, { children = [], ...activity }) => {
	return tx.activity.create({
		data: { ...activity, children: { create: children } },
		select: { id: true },
	});
};

/**
 * Content without activities.
 * @param {Prisma.PrismaClient | Prisma.Prisma.TransactionClient} tx
 * @param {{ authorId: string, ids?: string[], hashes?: string[] }} where
 * @returns {Promise<ActivityData[]>}
 */
export const contentUploadActivities = async (tx, { authorId, ids, hashes }) => {
	const contents = await tx.content.findMany({
		where: {
			authorId,
			activities: { none: {} },
			...(ids ? { id: { in: ids } } : {}),
			...(hashes ? { hash: { in: hashes } } : {}),
		},
		select: { id: true, createdTimestamp: true },
		orderBy: [{ createdTimestamp: 'asc' }, { id: 'asc' }],
	});

	return contents.map(({ id, createdTimestamp }) => ({
		type: ACTIVITY_TYPES.CONTENT_UPLOAD,
		userId: authorId,
		contentId: id,
		createdTimestamp,
	}));
};
