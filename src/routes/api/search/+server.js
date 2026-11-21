import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma.server.js';
import { toSnippet } from '$lib/utils/snippet';
import {
	ARTICLE_SELECT,
	articleMatches,
	contentMatches,
	contentTypeMatches,
	editorMatches,
	pageOf,
} from '$lib/db/search/conditions';

/**
 * @typedef {import('$lib/s3/limits.js').MimetypeType} MimetypeType
 */

const SHOWN_USED_IN = 3;

/**
 * @param {Prisma.Content & { usedIn?: Array<{ post: { rawTitle: string } }>, _count?: { usedIn: number } }} content
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
				titles: (content.usedIn ?? []).map(({ post }) => post.rawTitle),
				total: content._count.usedIn,
			}
		: undefined,
});

/**
 * Break ties by id.
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
 * @param {string[]} types
 * @param {{ orderBy: 'asc' | 'desc', contentTypes: string[], page: number }} [options]
 */
const getRecentUploads = async (types = [], options) => {
	const { orderBy = 'desc', contentTypes = [], page = 0 } = options || {};

	/** @type {QueryResult[]} */
	const results = [];

	let rawRecentYPosts;
	if ((types.length && types.includes('article')) || types.length === 0) {
		rawRecentYPosts = prisma.yPost.findMany({
			select: ARTICLE_SELECT,
			...pageOf(orderBy, page),
		});
	}

	let rawRecentContent;
	if ((types.length && types.includes('content')) || types.length === 0) {
		rawRecentContent = prisma.content.findMany({
			where: contentTypeMatches(contentTypes),
			...pageOf(orderBy, page),
		});
	}

	const [recentYPosts, recentContent] = await Promise.all([rawRecentYPosts, rawRecentContent]);

	if (recentYPosts) {
		results.push(...recentYPosts);
	}

	if (recentContent) {
		for (let index = 0; index < recentContent.length; index++) {
			const entry = recentContent[index];
			results.push(contentEntry(entry));
		}
	}

	for (let index = 0; index < results.length; index++) {
		const result = results[index];
		const { text } = result.html || {};
		if (result.html && text) {
			result.html.text = toSnippet(text);
		}
	}

	sortResults(results, orderBy);

	return { results };
};

/**
 * @typedef {{ type?: 'content', rawTitle: string, title: string, createdTimestamp: Date, id: string, fileType?: MimetypeType | typeof import('$lib/constants/content').LINK_CONTENT_TYPE, contentType?: string | null, usedIn?: { titles: string[], total: number }, html?: { image: string | null, text: string | null } | null }} QueryResult
 */

/**
 * @param {string} query
 * @param {string[]} types
 * @param {{ orderBy: 'asc' | 'desc', contentTypes: string[], page: number }} [options]
 */
export const _getSearch = async (query, types = [], options) => {
	const { orderBy = 'desc', contentTypes = [], page = 0 } = options || {};

	// Get recent uploads
	if (!query.length) {
		return getRecentUploads(types, options);
	}

	let rawRawTitleContains = null;
	let rawMetadata = null;

	if ((types.length && types.includes('article')) || types.length === 0) {
		rawRawTitleContains = prisma.yPost.findMany({
			where: articleMatches(query),
			select: ARTICLE_SELECT,
			...pageOf(orderBy, page),
		});

		rawMetadata = prisma.yPost.findMany({
			where: editorMatches(query),
			select: ARTICLE_SELECT,
			...pageOf(orderBy, page),
		});
	}

	let rawContent = null;
	if ((types.length && types.includes('content')) || types.length === 0) {
		rawContent = prisma.content.findMany({
			where: { ...contentMatches(query), ...contentTypeMatches(contentTypes) },
			include: {
				// The articles the search found it through.
				usedIn: {
					where: { post: articleMatches(query) },
					select: { post: { select: { rawTitle: true } } },
					orderBy: { post: { rawTitle: 'asc' } },
					take: SHOWN_USED_IN,
				},
				_count: { select: { usedIn: { where: { post: articleMatches(query) } } } },
			},
			...pageOf(orderBy, page),
		});
	}

	/** @type {QueryResult[]} */
	const results = [];
	const [titleContains, metadata, content] = await Promise.all([
		rawRawTitleContains,
		rawMetadata,
		rawContent,
	]);

	if (titleContains) {
		results.push(...titleContains);
	}

	if (metadata) {
		results.push(...metadata);
	}

	if (content) {
		for (let index = 0; index < content.length; index++) {
			const entry = content[index];
			results.push(contentEntry(entry));
		}
	}

	for (let index = 0; index < results.length; index++) {
		const result = results[index];
		const { text } = result.html || {};
		if (result.html && text) {
			result.html.text = toSnippet(text);
		}
	}

	sortResults(results, orderBy);

	// An article can match by title and by editor.
	return { results: [...new Map(results.map((result) => [result.id, result])).values()] };
};

/**
 * @param {URL} url
 */
export const _parseSearchParamsForSearch = (url) => {
	const rawQuery = url.searchParams.get('query') || '';
	const rawType = url.searchParams.getAll('type') || [];
	const rawContentType = url.searchParams.getAll('contenttype') || [];
	const rawOrderBy = url.searchParams.get('order') || 'desc';
	const rawPage = url.searchParams.get('page') || '0';

	const query = rawQuery.trim();
	const types = rawType.map((t) => t.trim()).filter(Boolean);
	const contentTypes = rawContentType.map((t) => t.trim()).filter(Boolean);
	const page = Number.isNaN(parseInt(rawPage)) ? 0 : parseInt(rawPage);

	/** @type {'asc' | 'desc'} */
	const orderBy = /** @type {any} */ (
		['asc', 'desc'].includes(rawOrderBy.toLowerCase()) ? rawOrderBy.toLowerCase() : 'desc'
	);

	return { query, types, options: { contentTypes, orderBy, page } };
};

export async function GET({ url }) {
	const { query, types, options } = _parseSearchParamsForSearch(url);

	const res = await _getSearch(query, types, options);

	return json(res.results);
}
