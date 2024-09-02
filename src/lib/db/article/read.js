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

/**
 * @type {Prisma.Prisma.YPostRelationInclude}
 */
const includeToPostYPostUpdate = {
	toPost: {
		select: {
			rawTitle: true,
			title: true,
			postUpdates: {
				select: {
					metadata: {
						select: {
							userId: true,
						},
					},
				},
			},
		},
	},
};

/** @param {string} postId */
export async function readSystemYPostRelations(postId) {
	return prisma.yPostRelation.findMany({
		where: {
			isSystem: true,
			fromPostId: postId,
		},
		include: includeToPostYPostUpdate,
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
