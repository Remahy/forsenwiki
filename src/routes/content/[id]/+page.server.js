import prisma from '#lib/prisma.server.js';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
	const { id } = params;

	const content = await prisma.content.findUnique({
		where: { id },
		include: {
			author: { select: { name: true, id: true } },
		},
	});

	if (!content) {
		return error(404, 'Not found');
	}

	return { result: content };
}
