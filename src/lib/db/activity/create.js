/**
 * @typedef {{
 *   type: import('$lib/constants/activity').ActivityType,
 *   explanation?: string,
 *   userId?: string,
 *   postId?: string,
 *   postUpdateId?: string,
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
