import prisma from '$lib/prisma.server.js';
import { error } from '@sveltejs/kit';
import { SYSTEM } from '$lib/constants/constants.js';

export async function load({ url, params }) {
	const { id } = params;

	const user = await prisma.user.findUnique({
		where: { id },
		select: { name: true, createdAt: true, image: true, permissions: { select: { type: true } } },
	});

	if (!user) {
		return error(404, 'User not found.');
	}

	let results = {
		editedArticles: 0,
		uploadedContent: {
			total: 0,
			images: 0,
			videos: 0,
			audio: 0,
			documents: 0,
		},
	};

	if (url.searchParams.get('noload')) {
		return { results, user };
	}

	if (id !== SYSTEM) {
		results.editedArticles = await prisma.yPost.count({
			where: { postUpdates: { some: { metadata: { userId: id } } } },
		});

		results.uploadedContent = {
			total: await prisma.content.count({
				where: { authorId: id },
			}),
			images: await prisma.content.count({
				where: { authorId: id, type: 'image' },
			}),
			videos: await prisma.content.count({
				where: { authorId: id, type: 'video' },
			}),
			audio: await prisma.content.count({
				where: { authorId: id, type: 'audio' },
			}),
			documents: await prisma.content.count({
				where: { authorId: id, type: 'document' },
			}),
		};
	}

	return { results, user };
}
