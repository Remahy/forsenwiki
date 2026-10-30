import prisma from '$lib/prisma.server';
import { Y_POST_TYPES } from '$lib/constants/constants';

/**
 * @param {string} title
 */
export async function readYPostUpdatesByTitle(title) {
	return prisma.yPost.findFirst({
		where: {
			title: {
				equals: title,
				mode: 'insensitive',
			},
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
					metadata: {
						select: {
							userId: true,
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
export async function readYPostUpdatesWithIdByTitle(title) {
	return prisma.yPost.findFirst({
		where: {
			title: {
				equals: title,
				mode: 'insensitive',
			},
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
					id: true,
					createdTimestamp: true,
					content: true,
					metadata: {
						select: {
							byteLength: true,
							newTitle: true,
							oldTitle: true,
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
	return prisma.yPost.findFirst({
		where: {
			title: {
				equals: title,
				mode: 'insensitive',
			},
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
							newTitle: true,
							oldTitle: true,
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
	return prisma.yPost.findFirst({
		where: {
			title: {
				equals: title,
				mode: 'insensitive',
			},
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
			id: true,
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

export async function readAllArticleTitles() {
	return prisma.yPost.findMany({
		where: {
			outRelations: {
				some: {
					isSystem: true,
					toPostId: Y_POST_TYPES.ARTICLE,
				},
			},
		},
		select: {
			title: true,
			rawTitle: true,
		},
	});
}

/**
 * @typedef {{
 *	title: string,
 *	rawTitle: string,
 *	image: string | null,
 *	linkCount: number
 * }} MostLinkedArticle
 */

const articleFilter = {
	outRelations: { some: { isSystem: true, toPostId: Y_POST_TYPES.ARTICLE } },
};

export async function readMostLinkedArticles(take = 8) {
	const counts = await prisma.yPostRelation.groupBy({
		by: ['toPostId'],
		where: {
			isSystem: false,
			fromPost: articleFilter,
			toPost: articleFilter,
		},
		_count: { fromPostId: true },
		orderBy: { _count: { fromPostId: 'desc' } },
		take,
	});

	const posts = await prisma.yPost.findMany({
		where: { id: { in: counts.map((c) => c.toPostId) } },
		select: { id: true, title: true, rawTitle: true, html: { select: { image: true } } },
	});

	const byId = new Map(posts.map((p) => [p.id, p]));

	/** @type {MostLinkedArticle[]} */
	const result = [];

	for (const { toPostId, _count } of counts) {
		const post = byId.get(toPostId);
		if (post) {
			result.push({
				title: post.title,
				rawTitle: post.rawTitle,
				image: post.html?.image ?? null,
				linkCount: _count.fromPostId,
			});
		}
	}

	return result;
}
