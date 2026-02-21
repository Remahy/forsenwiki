import prisma from '$lib/prisma';

/**
 * @param {string} postId
 * @param {{ content: string, text: string, image: string }} arg2
 */
export const upsertHTML = (postId, { content, text, image }) => {
	return prisma.html.upsert({
		where: {
			postId,
		},
		create: {
			postId,
			content,
		},
		update: {
			content,
			text,
			image,
		},
	});
};
