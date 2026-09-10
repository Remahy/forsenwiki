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

/**
 * @param {{ id: string }} user
 * @param {{ id: string }} post
 * @param {any} [type]
 */
export const readRangesForYPostByUser = (user, post, type = PostRangeType.REACTION) => {
	return prisma.yPostRelativeRange.findMany({
		where: {
			postId: post.id,
			user,
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