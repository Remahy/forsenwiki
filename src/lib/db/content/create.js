import prisma from '$lib/prisma';

/**
 * @param {{ name: string, hash: string, authorId: string }} CreateContentArg
 */
export const createContent = async ({ name, hash, authorId }) => {
	return prisma.content.create({
		data: {
			name,
			hash,
			authorId,
		},
	});
};
