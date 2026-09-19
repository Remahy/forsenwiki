import prisma from '$lib/prisma.server';

/**
 * @param {string} rangeId
 */
export async function deleteYPostRangeById(rangeId) {
	return prisma.yPostRelativeRange.delete({
		where: {
			id: rangeId,
		},
	});
}
