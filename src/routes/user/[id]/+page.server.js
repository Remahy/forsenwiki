import { error } from '@sveltejs/kit';
import prisma from '$lib/prisma.server.js';
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

	let stats = {
		editedArticles: 0,
		uploadedContent: {
			total: 0,
			images: 0,
			videos: 0,
			audio: 0,
			documents: 0,
		},
	};

	if (url.searchParams.has('noload')) {
		return { stats, user };
	}

	if (id !== SYSTEM) {
		stats.editedArticles = await prisma.yPost.count({
			where: { postUpdates: { some: { metadata: { userId: id } } } },
		});

		stats.uploadedContent = {
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

	return { stats, user };
}
