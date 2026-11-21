export const PAGE_SIZE = 50;

/**
 * Newest or oldest first, ties broken by id,
 * so articles and content merge into one order that a page can continue from.
 * @param {'asc' | 'desc'} orderBy
 * @returns {[{ createdTimestamp: 'asc' | 'desc' }, { id: 'asc' | 'desc' }]}
 */
export const pageOrder = (orderBy) => [{ createdTimestamp: orderBy }, { id: orderBy }];

/**
 * @param {'asc' | 'desc'} orderBy
 * @param {import('$lib/api/search/cursor').SearchCursor | null} after
 * @returns {Prisma.Prisma.YPostWhereInput & Prisma.Prisma.ContentWhereInput}
 */
export const rowsAfter = (orderBy, after) => {
	if (!after) {
		return {};
	}

	const { createdTimestamp, id } = after;
	if (orderBy === 'asc') {
		return {
			OR: [{ createdTimestamp: { gt: createdTimestamp } }, { createdTimestamp, id: { gt: id } }],
		};
	}

	return {
		OR: [{ createdTimestamp: { lt: createdTimestamp } }, { createdTimestamp, id: { lt: id } }],
	};
};

export const ARTICLE_SELECT = /** @satisfies {Prisma.Prisma.YPostSelect} */ ({
	html: { select: { content: true, text: true, image: true } },
	id: true,
	rawTitle: true,
	createdTimestamp: true,
	title: true,
});

/**
 * Articles found by title, also used to find the content they use.
 * @param {string} query
 * @returns {Prisma.Prisma.YPostWhereInput}
 */
export const articleMatches = (query) => ({
	OR: [
		{ rawTitle: { contains: query, mode: 'insensitive' } },
		{ title: { contains: query, mode: 'insensitive' } },
		{ id: { equals: query } },
	],
});

/**
 * Articles edited by the user with that name or id.
 * @param {string} query
 * @returns {Prisma.Prisma.YPostWhereInput}
 */
export const editorMatches = (query) => ({
	postUpdates: {
		some: {
			metadata: {
				OR: [{ user: { name: query.toLowerCase() } }, { user: { id: query.toLowerCase() } }],
			},
		},
	},
});

/**
 * Content by its uploader, name or hash, or used in an article found by title.
 * @param {string} query
 * @returns {Prisma.Prisma.ContentWhereInput}
 */
export const contentMatches = (query) => ({
	OR: [
		{ author: { name: query.toLowerCase() } },
		{ author: { id: query.toLowerCase() } },
		{ name: { contains: query.toLowerCase(), mode: 'insensitive' } },
		{ hash: { equals: query.toLowerCase() } },
		{ usedIn: { some: { post: articleMatches(query) } } },
	],
});

/**
 * No types is every type.
 * @param {string[]} contentTypes
 * @returns {Prisma.Prisma.ContentWhereInput}
 */
export const contentTypeMatches = (contentTypes) => ({
	type: contentTypes.length ? { in: contentTypes } : undefined,
});
