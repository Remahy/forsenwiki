/**
 * Content still in the article keeps the update that first added it.
 * @param {Prisma.PrismaClient | Prisma.Prisma.TransactionClient} tx
 * @param {{ postId: string, postUpdate: { id: string, createdTimestamp: Date }, hashes: string[] }} arg1
 */
export const syncPostContent = async (tx, { postId, postUpdate, hashes }) => {
	const contents = await tx.content.findMany({
		where: { hash: { in: hashes } },
		select: { id: true },
	});
	const contentIds = contents.map(({ id }) => id);

	await tx.yPostContent.deleteMany({ where: { postId, contentId: { notIn: contentIds } } });

	await tx.yPostContent.createMany({
		data: contentIds.map((contentId) => ({
			postId,
			contentId,
			postUpdateId: postUpdate.id,
			createdTimestamp: postUpdate.createdTimestamp,
		})),
		skipDuplicates: true,
	});
};
