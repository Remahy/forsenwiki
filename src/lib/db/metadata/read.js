import prisma from '$lib/prisma';

/** @param {string} postUpdateId */
export async function readAuthorForYPostUpdate(postUpdateId) {
	return prisma.user.findFirst({
		where: {
			postUpdatesMetadata: {
				some: {
					postUpdate: {
						id: postUpdateId,
					},
				},
			},
		},
		select: {
			name: true,
		},
	});
}
