import prisma from '$lib/prisma.server';

/**
 * @param {{ title: { raw: string, sanitized: string }, data: { content: string }, ids: string[] }} arg1
 * @param {{ user: { name: string, id: string }, byteLength: number, type: import('$lib/constants/constants').Y_POST_TYPES_VALUES }} metadata
 */
export const createPost = async ({ title, data, ids }, metadata) => {
	const outRelations = ids.map((id) => ({ isSystem: false, toPostId: id }));

	const { user, byteLength } = metadata;

	const { post, postUpdate } = await prisma.$transaction(async (tx) => {
		// Create yPost
		const post = await tx.yPost.create({
			data: {
				rawTitle: title.raw,
				title: title.sanitized,
				outRelations: {
					createMany: {
						data: [
							{
								isSystem: true,
								toPostId: metadata.type,
							},
							...outRelations,
						],
						skipDuplicates: true,
					},
				},
				// Update's byteLength is the current total byteLength on creation.
				totalByteLength: metadata.byteLength,
			},
			select: {
				id: true,
				title: true,
				rawTitle: true,
				createdTimestamp: true,
			},
			// @ts-ignore
			_metadata: {
				user,
				byteLength,
			},
		});

		const postUpdate = await tx.yPostUpdate.create({
			data: {
				...data,
				post: {
					connect: {
						id: post.id,
					},
				},
				metadata: {
					create: {
						user: {
							connect: {
								id: user.id,
							},
						},
						byteLength,
						newTitle: post.rawTitle,
					},
				},
			},
		});

		return { post, postUpdate };
	});

	return {
		...post,
		postUpdate: {
			id: postUpdate.id,
		},
	};
};
