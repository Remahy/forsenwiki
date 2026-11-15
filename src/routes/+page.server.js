import { GOATCOUNTER_API_KEY, GOATCOUNTER_DISABLED } from '$env/static/private';
import prisma from '$lib/prisma.server';
import { getPopularArticles } from '$lib/goatcounter.server';
import { Y_POST_TYPES } from '$lib/constants/constants';
import { readMostLinkedArticles } from '$lib/db/post/read';

/**
 * @typedef {{ rawTitle: string, title: string, createdTimestamp: string, author: string | null, authorId: string | null }} LatestArticle
 * @typedef {import('$lib/goatcounter.server').GoatCounterHit} GoatCounterHit
 * @typedef {import('$lib/db/post/read').MostLinkedArticle} MostLinkedArticle
 */

/** @type {{
 *	latestArticles: LatestArticle[],
 *	popularArticles: GoatCounterHit[],
 *	mostLinkedArticles: MostLinkedArticle[]
 * }} */
let cache = { latestArticles: [], popularArticles: [], mostLinkedArticles: [] };
let lastCacheUpdate = Date.now() - 1_800_000;

const getLatest = async () => {
	if (Date.now() - lastCacheUpdate < 1_800_000) {
		return cache;
	}

	/** @type {GoatCounterHit[]} */
	let popularArticles = [];

	try {
		popularArticles = await getPopularArticles();
	} catch (err) {
		if (GOATCOUNTER_API_KEY && !GOATCOUNTER_DISABLED) {
			console.error(err);
		}
	}

	const yPosts = prisma.yPost.findMany({
		where: {
			outRelations: {
				some: {
					isSystem: true,
					toPostId: Y_POST_TYPES.ARTICLE,
				},
			},
		},
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
									id: true,
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
		take: 10,
	});

	const mostLinked = readMostLinkedArticles(8);

	const [rawLatestArticles, mostLinkedArticles] = await Promise.all([yPosts, mostLinked]);

	const latestArticles = rawLatestArticles.map((post) => ({
		rawTitle: post.rawTitle,
		title: post.title,
		createdTimestamp: post.createdTimestamp.toString(),
		author: post.postUpdates[0].metadata.user.name,
		authorId: post.postUpdates[0].metadata.user.id,
	}));

	cache = {
		latestArticles,
		popularArticles,
		mostLinkedArticles,
	};
	lastCacheUpdate = Date.now();

	return cache;
};

export async function load() {
	return { ...(await getLatest()), globeSeed: Math.random() };
}
