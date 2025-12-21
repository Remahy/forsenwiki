import prisma from '$lib/prisma';

/** @param {string} id */
export const deleteContent = async (id) => {
	return prisma.content.delete({ where: { id } });
};
