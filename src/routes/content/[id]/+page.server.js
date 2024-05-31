import prisma from '$lib/prisma';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
	const { id } = params;

	const content = await prisma.content.findUnique({
		where: { id },
		select: { hash: true, author: { select: { name: true } }, createdAt: true, name: true },
	});

	if (!content) {
		return error(404, 'Not found');
	}

	return { result: content };
}
