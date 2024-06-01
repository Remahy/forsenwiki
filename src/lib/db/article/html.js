import prisma from '$lib/prisma';

/**
 * @param {string} postId
 * @param {string} content
 */
export const upsertHTML = (postId, content) => {
	return prisma.html.upsert({
		where: {
			postId,
		},
		create: {
			postId,
			content
		},
		update:{
			content
		}
	});
};
