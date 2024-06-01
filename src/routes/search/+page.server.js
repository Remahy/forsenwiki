import prisma from '$lib/prisma';
import { getCacheURL } from '$lib/utils/getCacheURL';

/**
 * @typedef {{ type?: 'content', rawTitle: string, title: string, lastUpdated: Date, id: string }} QueryResult
 */

/**
 * @returns {Promise<{ results: QueryResult[] }>}
 */
export const load = async ({ url }) => {
	const rawQuery = url.searchParams.get('query');

	if (!rawQuery) {
		return { results: [] };
	}

	const query = rawQuery.trim();

	const rawRawTitleContains = prisma.yPost.findMany({
		where: {
			rawTitle: {
				contains: query,
				mode: 'insensitive',
			},
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

	const rawContentUserName = prisma.content.findMany({
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

	/** @type {QueryResult[]} */
	let results = [];
	const [rawTitleContains, metadataUserName, contentUserName] = await Promise.all([
		rawRawTitleContains,
		rawMetadataUserName,
		rawContentUserName,
	]);

	results.push(...rawTitleContains);
	results.push(...metadataUserName);

	for (let index = 0; index < contentUserName.length; index++) {
		const { name, hash, createdAt, id } = contentUserName[index];

		results.push({
			type: 'content',
			lastUpdated: createdAt,
			rawTitle: name,
			title: getCacheURL(hash, name).toString(),
			id,
		});
	}

	return { results: results.flat() };
};
