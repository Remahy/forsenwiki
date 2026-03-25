import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma.server.js';

/**
 * @typedef {ReturnType<import('../../../lib/s3/limits.js').getType>} MimetypeType
 */

/**
 * @param {Prisma.Content} content
 * @returns {QueryResult}
 */
const contentEntry = (content) => ({
	id: content.id,
	type: 'content',
	// @ts-ignore
	fileType: content.type,
	contentType: content.contentType,
	lastUpdated: content.createdTimestamp,
	rawTitle: content.name,
	title: content.hash,
});

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
			orderBy: { createdTimestamp: orderBy },
			skip: 51 * page,
			take: 50,
			select: {
				html: {
					select: {
						content: true,
						text: true,
						image: true,
					},
				},
				id: true,
				rawTitle: true,
				lastUpdated: true,
				title: true,
			},
		});
	}

	let rawRecentContent;
	if ((types.length && types.includes('content')) || types.length === 0) {
		rawRecentContent = prisma.content.findMany({
			where: {
				type: contentTypes?.length
					? {
							in: contentTypes,
						}
					: undefined,
			},
			orderBy: { createdTimestamp: orderBy },
			skip: 51 * page,
			take: 50,
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
			result.html.text = `${text.substring(0, 150)}${text.length > 150 ? '...' : ''}`;
		}
	}

	results.sort((a, b) =>
		orderBy === 'asc'
			? a.lastUpdated.getTime() - b.lastUpdated.getTime()
			: b.lastUpdated.getTime() - a.lastUpdated.getTime()
	);

	return { results };
};

/**
 * @typedef {{ type?: 'content', rawTitle: string, title: string, lastUpdated: Date, id: string, fileType?: MimetypeType, contentType?: string | null, html?: { image: string | null, text: string | null } | null }} QueryResult
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
	let rawMetadataUserName = null;

	if ((types.length && types.includes('article')) || types.length === 0) {
		rawRawTitleContains = prisma.yPost.findMany({
			where: {
				OR: [
					{
						rawTitle: {
							contains: query,
							mode: 'insensitive',
						},
					},
					{
						title: {
							contains: query,
							mode: 'insensitive',
						},
					},
					{
						id: {
							equals: query,
						},
					},
				],
			},
			select: {
				html: {
					select: {
						content: true,
						text: true,
						image: true,
					},
				},
				id: true,
				rawTitle: true,
				lastUpdated: true,
				title: true,
			},
			skip: 51 * page,
			take: 50,
		});

		rawMetadataUserName = prisma.yPost.findMany({
			where: {
				postUpdates: {
					some: {
						metadata: {
							user: {
								name: query.toLowerCase(),
							},
						},
					},
				},
			},
			select: {
				html: {
					select: {
						content: true,
						text: true,
						image: true,
					},
				},
				id: true,
				rawTitle: true,
				lastUpdated: true,
				title: true,
			},
			skip: 51 * page,
			take: 50,
		});
	}

	let rawContentUserName = null;
	if ((types.length && types.includes('content')) || types.length === 0) {
		rawContentUserName = prisma.content.findMany({
			where: {
				OR: [
					{
						author: {
							name: query.toLowerCase(),
						},
					},
					{
						name: {
							contains: query.toLowerCase(),
							mode: 'insensitive',
						},
					},
				],

				type: contentTypes?.length
					? {
							in: contentTypes,
						}
					: undefined,
			},
			skip: 51 * page,
			take: 50,
		});
	}

	/** @type {QueryResult[]} */
	const results = [];
	const [rawTitleContains, metadataUserName, contentUserName] = await Promise.all([
		rawRawTitleContains,
		rawMetadataUserName,
		rawContentUserName,
	]);

	if (rawTitleContains) {
		results.push(...rawTitleContains);
	}

	if (metadataUserName) {
		results.push(...metadataUserName);
	}

	if (contentUserName) {
		for (let index = 0; index < contentUserName.length; index++) {
			const entry = contentUserName[index];
			results.push(contentEntry(entry));
		}
	}

	for (let index = 0; index < results.length; index++) {
		const result = results[index];
		const { text } = result.html || {};
		if (result.html && text) {
			result.html.text = `${text.substring(0, 150)}${text.length > 150 ? '...' : ''}`;
		}
	}

	results.sort((a, b) =>
		orderBy === 'asc'
			? a.lastUpdated.getTime() - b.lastUpdated.getTime()
			: b.lastUpdated.getTime() - a.lastUpdated.getTime()
	);

	return { results: results.flat() };
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
