import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma';

/**
 * @param {string[]} types
 * @param {'asc' | 'desc'} orderBy
 */
const getRecentUploads = async (types = [], orderBy = 'desc') => {
	/** @type {QueryResult[]} */
	const results = [];

	let rawRecentYPosts;
	if ((types.length && types.includes('article')) || types.length === 0) {
		rawRecentYPosts = prisma.yPost.findMany({ orderBy: { createdTimestamp: orderBy }, take: 50 });
	}

	let rawRecentContent;
	if ((types.length && types.includes('content')) || types.length === 0) {
		rawRecentContent = prisma.content.findMany({
			orderBy: { createdTimestamp: orderBy },
			take: 50,
		});
	}

	const [recentYPosts, recentContent] = await Promise.all([rawRecentYPosts, rawRecentContent]);

	if (recentYPosts) {
		results.push(...recentYPosts);
	}

	if (recentContent) {
		for (let index = 0; index < recentContent.length; index++) {
			const { name, hash, createdTimestamp, id } = recentContent[index];

			results.push({
				type: 'content',
				lastUpdated: createdTimestamp,
				rawTitle: name,
				title: hash,
				id,
			});
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
 * @typedef {{ type?: 'content', rawTitle: string, title: string, lastUpdated: Date, id: string, contentType?: string | null, html?: { image: string | null, text: string | null } | null }} QueryResult
 */

/**
 * @param {string} query
 * @param {string[]} types
 * @param {'asc' | 'desc'} [orderBy]
 */
export const _getSearch = async (query, types = [], orderBy) => {
	// Get recent uploads
	if (!query.length) {
		return getRecentUploads(types, orderBy);
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
			},
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
			const { name, hash, contentType, createdTimestamp, id } = contentUserName[index];

			results.push({
				type: 'content',
				contentType,
				lastUpdated: createdTimestamp,
				rawTitle: name,
				title: hash,
				id,
			});
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

export async function GET({ url }) {
	const rawQuery = url.searchParams.get('query') || '';
	const rawTypes = url.searchParams.getAll('type') || [];

	const query = rawQuery.trim();
	const types = rawTypes.map((t) => t.trim()).filter(Boolean);

	const res = await _getSearch(query, types);

	return json(res.results);
}
