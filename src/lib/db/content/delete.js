import prisma from '$lib/prisma.server';

/** @param {string} id */
export const deleteContent = async (id) => {
	return prisma.content.delete({ where: { id } });
};
