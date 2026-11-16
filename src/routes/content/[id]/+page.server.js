import prisma from '$lib/prisma.server';
import { error } from '@sveltejs/kit';
import { WIKI_LINK_HASH } from '$lib/db/content/delete';

export async function load({ params }) {
	const { id } = params;

	const content = await prisma.content.findUnique({
		where: { id },
		include: {
			author: { select: { name: true, id: true } },
			usedIn: {
				select: {
					post: { select: { title: true, rawTitle: true } },
					postUpdateId: true,
					createdTimestamp: true,
				},
				orderBy: { post: { rawTitle: 'asc' } },
			},
		},
	});

	if (!content) {
		return error(404, 'Not found');
	}

	return { result: content, isWikiLink: content.hash === WIKI_LINK_HASH };
}
