import prisma from '$lib/prisma.server';

/**
 * @param {string} postId
 * @param {{ content: string, text: string, image?: string }} data
 */
export const upsertHTML = (postId, { content, text, image }) => {
	return prisma.html.upsert({
		where: {
			postId,
		},
		create: {
			postId,
			content,
			text,
			image,
		},
		update: {
			content,
			text,
			image,
		},
	});
};

/**
 * @param {string} postId
 * @param {Date} lastUpdated
 * @param {{ content: string, text: string, image?: string }} data
 */
export const updateHTMLIfUnchanged = (postId, lastUpdated, data) => {
	return prisma.html.updateMany({
		where: { postId, post: { is: { lastUpdated } } },
		data,
	});
};
