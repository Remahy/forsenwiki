import prisma from '$lib/prisma.server';

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
			id: true,
		},
	});
}

/**
 * @param {string[]} userIds
 * @returns {Promise<Record<string, string | null>>}
 */
export async function readUserNamesByIds(userIds) {
	const users = await prisma.user.findMany({
		where: { id: { in: [...new Set(userIds)] } },
		select: { id: true, name: true },
	});

	return Object.fromEntries(users.map(({ id, name }) => [id, name]));
}
