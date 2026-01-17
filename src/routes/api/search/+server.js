import { json } from '@sveltejs/kit';
import { getCacheURL } from '$lib/utils/getCacheURL';
import prisma from '$lib/prisma';

/**
 * @typedef {{ type?: 'content', rawTitle: string, title: string, lastUpdated: Date, id: string }} QueryResult
 */

/**
 * @param {string} query
 * @param {string[]} types
 * @returns {Promise<{ results: QueryResult[] }>}
 */
export const _getSearch = async (query, types = []) => {
	const rawRawTitleContains = prisma.yPost.findMany({
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
			id: true,
			rawTitle: true,
			lastUpdated: true,
			title: true,
		},
	});

	const rawMetadataUserName = prisma.yPost.findMany({
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
			id: true,
			rawTitle: true,
			lastUpdated: true,
			title: true,
		},
	});

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
	let results = [];
	const [rawTitleContains, metadataUserName, contentUserName] = await Promise.all([
		rawRawTitleContains,
		rawMetadataUserName,
		rawContentUserName,
	]);

	results.push(...rawTitleContains);
	results.push(...metadataUserName);

	if (contentUserName) {
		for (let index = 0; index < contentUserName.length; index++) {
			const { name, hash, createdTimestamp, id } = contentUserName[index];

			results.push({
				type: 'content',
				lastUpdated: createdTimestamp,
				rawTitle: name,
				title: getCacheURL(hash, name).toString(),
				id,
			});
		}
	}

	return { results: results.flat() };
};

export async function GET({ url }) {
	const rawQuery = url.searchParams.get('query');
	const types = url.searchParams.getAll('type');

	if (!rawQuery) {
		return json([]);
	}

	const query = rawQuery.trim();

	const res = await _getSearch(query, types);

	return json(res.results);
}
