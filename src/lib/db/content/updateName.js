import prisma from "$lib/prisma";

/**
 * @param {string} id
 * @param {string} name
 */
export const updateContentName = async (id, name) => {
	return prisma.content.update({ where: { id }, data: { name }, select: { name: true } });
};
