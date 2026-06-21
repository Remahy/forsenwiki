import prisma, { PostRangeType } from '$lib/prisma.server';

/**
 * @param {{ id: string }} post
 * @param {any} [type]
 */
export const readRangesForYPost = (post, type = PostRangeType.REACTION) => {
	return prisma.yPostRelativeRange.findMany({
		where: {
			postId: post.id,
			type,
		},
		include: {
			user: {
				select: {
					id: true,
					name: true,
				},
			},
		},
		omit: {
			postId: true,
			userId: true,
		},
	});
};
