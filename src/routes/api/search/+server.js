import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma.server.js';
import { toSnippet } from '$lib/utils/snippet';
import { parseCursor } from '$lib/api/search/cursor';
import {
	ARTICLE_SELECT,
	PAGE_SIZE,
	articleMatches,
	contentMatches,
	contentTypeMatches,
	editorMatches,
	pageOrder,
	rowsAfter,
} from '$lib/db/search/conditions';

/**
 * @typedef {import('$lib/s3/limits.js').MimetypeType} MimetypeType
 * @typedef {{ title: string, rawTitle: string }} UsedInArticle
 */

const SHOWN_USED_IN = 3;

/**
 * @param {Prisma.Content & { usedIn?: Array<{ post: UsedInArticle }>, _count?: { usedIn: number } }} content
 * @returns {QueryResult}
 */
const contentEntry = (content) => ({
	id: content.id,
	type: 'content',
	// @ts-ignore
	fileType: content.type,
	contentType: content.contentType,
	createdTimestamp: content.createdTimestamp,
	rawTitle: content.name,
	title: content.hash,
	usedIn: content._count?.usedIn
		? {
				articles: (content.usedIn ?? []).map(({ post }) => post),
				total: content._count.usedIn,
			}
		: undefined,
});

/**
 * The same order as `pageOrder`, so the last result is where the next page starts.
 * @param {QueryResult[]} results
 * @param {'asc' | 'desc'} orderBy
 */
const sortResults = (results, orderBy) => {
	const direction = orderBy === 'asc' ? 1 : -1;

	results.sort(
		(a, b) =>
			direction *
			(a.createdTimestamp.getTime() - b.createdTimestamp.getTime() ||
				(a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
	);
};

/**
 * @typedef {{ type?: 'content', rawTitle: string, title: string, createdTimestamp: Date, id: string, fileType?: MimetypeType | typeof import('$lib/constants/content').LINK_CONTENT_TYPE, contentType?: string | null, usedIn?: { articles: UsedInArticle[], total: number }, html?: { image: string | null, text: string | null } | null }} QueryResult
 */

/**
 * An empty query lists everything.
 * @param {string} query
 * @param {string[]} types
 * @param {{ orderBy: 'asc' | 'desc', contentTypes: string[], after?: import('$lib/api/search/cursor').SearchCursor | null }} [options]
 */
export const _getSearch = async (query, types = [], options) => {
	const { orderBy = 'desc', contentTypes = [], after = null } = options || {};

	const page = { orderBy: pageOrder(orderBy), take: PAGE_SIZE };
	const continued = rowsAfter(orderBy, after);

	const rawArticles =
		!types.length || types.includes('article')
			? prisma.yPost.findMany({
					where: {
						AND: [query ? { OR: [articleMatches(query), editorMatches(query)] } : {}, continued],
					},
					select: ARTICLE_SELECT,
					...page,
				})
			: [];

	const rawContent =
		!types.length || types.includes('content')
			? prisma.content.findMany({
					where: {
						AND: [query ? contentMatches(query) : {}, contentTypeMatches(contentTypes), continued],
					},
					// The articles the search found it through.
					include: query
						? {
								usedIn: {
									where: { post: articleMatches(query) },
									select: { post: { select: { title: true, rawTitle: true } } },
									orderBy: { post: { rawTitle: 'asc' } },
									take: SHOWN_USED_IN,
								},
								_count: { select: { usedIn: { where: { post: articleMatches(query) } } } },
							}
						: undefined,
					...page,
				})
			: [];

	const [articles, content] = await Promise.all([rawArticles, rawContent]);

	/** @type {QueryResult[]} */
	const results = [...articles, ...content.map(contentEntry)];

	for (let index = 0; index < results.length; index++) {
		const result = results[index];
		const { text } = result.html || {};
		if (result.html && text) {
			result.html.text = toSnippet(text);
		}
	}

	sortResults(results, orderBy);

	// The rest come after the last one kept, on the next page.
	return { results: results.slice(0, PAGE_SIZE) };
};

/**
 * @param {URL} url
 */
export const _parseSearchParamsForSearch = (url) => {
	const rawQuery = url.searchParams.get('query') || '';
	const rawType = url.searchParams.getAll('type') || [];
	const rawContentType = url.searchParams.getAll('contenttype') || [];
	const rawOrderBy = url.searchParams.get('order') || 'desc';

	const query = rawQuery.trim();
	const types = rawType.map((t) => t.trim()).filter(Boolean);
	const contentTypes = rawContentType.map((t) => t.trim()).filter(Boolean);
	const after = parseCursor(url.searchParams.get('after'));

	/** @type {'asc' | 'desc'} */
	const orderBy = /** @type {any} */ (
		['asc', 'desc'].includes(rawOrderBy.toLowerCase()) ? rawOrderBy.toLowerCase() : 'desc'
	);

	return { query, types, options: { contentTypes, orderBy, after } };
};

export async function GET({ url }) {
	const { query, types, options } = _parseSearchParamsForSearch(url);

	const res = await _getSearch(query, types, options);

	return json(res.results);
}
