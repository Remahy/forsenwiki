import prisma from '$lib/prisma';
import { getPopularArticles } from '$lib/goatcounter.server';

/**
 * @typedef {{ rawTitle: string, title: string, createdTimestamp: string, author: string | null }} LatestArticle
 * @typedef {{ name: string | null }} LatestUser
 * @typedef {import('$lib/goatcounter.server').GoatCounterHit} GoatCounterHit
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

/** @type {{
 *	latestArticles: LatestArticle[],
 *	latestUsers: LatestUser[],
 *	popularArticles: GoatCounterHit[]
 * }} */
let cache = { latestArticles: [], latestUsers: [], popularArticles: [] };
let lastCacheUpdate = Date.now() - 1_800_000;

const getLatest = async () => {
	if (Date.now() - lastCacheUpdate < 1_800_000) {
		return cache;
	}

	/** @type {GoatCounterHit[]} */
	let popularArticles = [];

	try {
		popularArticles = await getPopularArticles();
	} catch (error) {
		// noop
		console.error(error);
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
		take: popularArticles.length ? 5 : 9,
	});

	const users = prisma.user.findMany(usersQuery);

	const [rawLatestArticles, latestUsers] = await Promise.all([yPosts, users]);

	const latestArticles = rawLatestArticles.map((post) => ({
		rawTitle: post.rawTitle,
		title: post.title,
		createdTimestamp: post.createdTimestamp.toString(),
		author: post.postUpdates[0].metadata.user.name,
	}));

	cache = {
		latestArticles,
		latestUsers,
		popularArticles,
	};
	lastCacheUpdate = Date.now();

	return cache;
};

export function load() {
	return getLatest();
}
