import { error } from '@sveltejs/kit';
import prisma, { PostRangeType } from '$lib/prisma.server.js';
import { SYSTEM } from '$lib/constants/constants.js';

export async function load({ url, params }) {
	const { idOrName } = params;

	let user = await prisma.user.findUnique({
		where: { id: idOrName },
		select: {
			name: true,
			createdAt: true,
			image: true,
			permissions: { select: { type: true } },
			id: true,
		},
	});

	if (!user) {
		user = await prisma.user.findFirst({
			where: { name: idOrName },
			select: {
				name: true,
				createdAt: true,
				image: true,
				permissions: { select: { type: true } },
				id: true,
			},
		});
	}

	if (!user) {
		return error(404, 'User not found.');
	}

	const { id } = user;

	let stats = {
		editedArticles: 0,
		reactions: 0,
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
		const [editedArticles, reactions, total, images, videos, audio, documents] = await Promise.all([
			prisma.yPost.count({
				where: { postUpdates: { some: { metadata: { userId: id } } } },
			}),
			prisma.yPostRelativeRange.count({
				where: {
					userId: id,
					type: PostRangeType.REACTION,
				},
			}),
			prisma.content.count({
				where: { authorId: id },
			}),
			prisma.content.count({
				where: { authorId: id, type: 'image' },
			}),
			prisma.content.count({
				where: { authorId: id, type: 'video' },
			}),
			prisma.content.count({
				where: { authorId: id, type: 'audio' },
			}),
			prisma.content.count({
				where: { authorId: id, type: 'document' },
			}),
		]);

		stats.editedArticles = editedArticles;

		stats.reactions = reactions;

		stats.uploadedContent = {
			total,
			images,
			videos,
			audio,
			documents,
		};
	}

	return { stats, user };
}
