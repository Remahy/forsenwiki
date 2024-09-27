import prisma from '$lib/prisma';

/**
 * @typedef {{ rawTitle: string, title: string, createdTimestamp: string, author: string | null }} LatestArticle
 * @typedef {{ rawTitle: string, title: string, lastUpdated: string, author: string | null }} LatestUpdate
 * @typedef {{ name: string | null }} LatestUser
 */

/** @type {Prisma.Prisma.UserFindManyArgs} */
const usersQuery = {
	select: {
		name: true,
	},
	orderBy: {
		createdAt: 'desc',
	},
	take: 5,
};

/** @type {{ latestArticles: LatestArticle[], latestUpdates: LatestUpdate[], latestUsers: LatestUser[] }} */
let cache = { latestArticles: [], latestUpdates: [], latestUsers: [] };
let lastCacheUpdate = Date.now() - 1_800_000;

const getLatest = async () => {
	if (Date.now() - lastCacheUpdate < 1_800_000) {
		return cache;
	}

	const yPosts = prisma.yPost.findMany({
		select: {
			rawTitle: true,
			title: true,
			createdTimestamp: true,
			postUpdates: {
				select: {
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
				take: 1,
				orderBy: {
					createdTimestamp: 'asc',
				},
			},
		},
		orderBy: {
			createdTimestamp: 'desc',
		},
		take: 5,
	});

	const yPostUpdates = prisma.yPostUpdate.findMany({
		select: {
			createdTimestamp: true,
			post: {
				select: {
					title: true,
					rawTitle: true,
				},
			},
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
		take: 5,
	});

	const users = prisma.user.findMany(usersQuery);

	const [rawLatestArticles, rawLatestUpdates, latestUsers] = await Promise.all([
		yPosts,
		yPostUpdates,
		users,
	]);

	const latestArticles = rawLatestArticles.map((post) => ({
		rawTitle: post.rawTitle,
		title: post.title,
		createdTimestamp: post.createdTimestamp.toString(),
		author: post.postUpdates[0].metadata.user.name,
	}));

	const latestUpdates = rawLatestUpdates.map((update) => ({
		...update.post,
		author: update.metadata.user.name,
		// Not a typo, technically an update's "createdTimestamp" *is* a yPost's lastUpdated.
		lastUpdated: update.createdTimestamp.toString(),
	}));

	cache = {
		latestArticles,
		latestUpdates,
		latestUsers,
	};
	lastCacheUpdate = Date.now();

	return cache;
};

export function load() {
	return getLatest();
}
