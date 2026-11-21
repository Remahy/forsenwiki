import prisma from '$lib/prisma.server';
import { error } from '@sveltejs/kit';
import { WIKI_LINK_HASH } from '$lib/constants/content.server';
import { USED_IN } from '$lib/db/content/usage';

export async function load({ params }) {
	const { id } = params;

	const content = await prisma.content.findUnique({
		where: { id },
		include: {
			author: { select: { name: true, id: true } },
			usedIn: USED_IN,
		},
	});

	if (!content) {
		return error(404, 'Not found');
	}

	return { result: content, isWikiLink: content.hash === WIKI_LINK_HASH };
}
