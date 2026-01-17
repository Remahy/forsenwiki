import prisma from '$lib/prisma';

/**
 * @param {string} title
 */
export async function readYPostUpdatesByTitle(title) {
	return prisma.yPost.findUnique({
		where: {
			title,
		},
		include: {
			outRelations: {
				select: {
					isSystem: true,
					toPost: {
						select: {
							postUpdates: {
								select: {
									id: true,
								},
								take: 1,
							},
						},
					},
					toPostId: true,
				},
			},
			postUpdates: {
				select: {
					content: true,
				},
				orderBy: {
					createdTimestamp: 'asc',
				},
			},
		},
	});
}

/**
 * @param {string} title
 */
export async function readYPostUpdatesWithIdByTitle(title) {
	return prisma.yPost.findUnique({
		where: {
			title,
		},
		include: {
			postUpdates: {
				select: {
					id: true,
					createdTimestamp: true,
					content: true,
					metadata: {
						select: {
							byteLength: true,
						},
					},
				},
				orderBy: {
					createdTimestamp: 'asc',
				},
			},
		},
	});
}

/**
 * @param {string} title
 */
export async function readYPostUpdatesIdsByTitle(title) {
	return prisma.yPost.findUnique({
		where: {
			title,
		},
		include: {
			postUpdates: {
				select: {
					id: true,
					createdTimestamp: true,
					metadata: {
						select: {
							user: {
								select: {
									name: true,
								},
							},
							byteLength: true,
						},
					},
				},
				orderBy: {
					createdTimestamp: 'desc',
				},
			},
		},
	});
}

/**
 * @param {string} title
 */
export async function readYPostByTitle(title) {
	return prisma.yPost.findUnique({
		where: {
			title,
		},
		include: {
			html: {
				select: {
					content: true,
					text: true,
					image: true,
				},
			},
			outRelations: {
				select: {
					isSystem: true,
					toPost: {
						select: {
							postUpdates: {
								select: {
									id: true,
								},
								take: 1,
							},
						},
					},
					toPostId: true,
				},
			},
		},
	});
}

/** @param {string} postId */
export async function readSystemYPostRelations(postId) {
	return prisma.yPostRelation.findMany({
		where: {
			isSystem: true,
			fromPostId: postId,
		},
	});
}

/** @param {string} title */
export async function readAuthorsForYPostByTitle(title) {
	return prisma.user.findMany({
		where: {
			postUpdatesMetadata: {
				some: {
					postUpdate: {
						post: {
							title,
						},
					},
				},
			},
		},
		select: {
			name: true,
		},
	});
}

/**
 * @param {string[]} ids
 */
export async function readYPostsByIds(ids) {
	return prisma.yPost.findMany({
		where: {
			id: {
				in: ids,
			},
		},
	});
}

/** @param {string} title */
export async function readRelationsToYPostTitle(title) {
	return prisma.yPost.findMany({
		where: {
			outRelations: {
				some: {
					toPost: {
						title,
					},
				},
			},
		},
		select: {
			title: true,
			rawTitle: true,
		},
		orderBy: {
			lastUpdated: 'asc',
		},
	});
}
