import prisma from '$lib/prisma.server';

export const USED_IN = /** @satisfies {Prisma.Prisma.Content$usedInArgs} */ ({
	select: {
		post: { select: { title: true, rawTitle: true } },
		postUpdateId: true,
		createdTimestamp: true,
	},
	orderBy: { post: { rawTitle: 'asc' } },
});

/** @param {string} id */
export const readContentUsage = (id) =>
	prisma.content.findUnique({
		where: { id },
		select: { id: true, hash: true, name: true, type: true, usedIn: USED_IN },
	});
