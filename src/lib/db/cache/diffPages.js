import prisma from '$lib/prisma.server';

import { MADE_BY, pack, unpack } from './pack';

/**
 * @typedef {Object} DiffPage
 * @property {'split' | 'combined'} view
 * @property {import('$lib/lexical/diff/helpers').DiffRow[]} rows The changed rows of this page.
 * @property {number} pages
 * @property {number} total The changed rows of all pages.
 * @property {boolean} partial
 * @property {boolean} attributed
 */

/**
 * @param {string} olderId
 * @param {string} newerId
 * @param {number} page
 * @returns {Promise<DiffPage | null>}
 */
export const readDiffPage = async (olderId, newerId, page) => {
	const row = await prisma.yPostDiffPageCache.findUnique({
		where: { olderId_newerId_page: { olderId, newerId, page } },
	});

	return row?.madeBy === MADE_BY ? unpack(row.content) : null;
};

/**
 * @param {string} olderId
 * @param {string} newerId
 * @param {DiffPage[]} pages
 */
export const writeDiffPages = async (olderId, newerId, pages) => {
	const data = await Promise.all(
		pages.map(async (content, page) => ({
			olderId,
			newerId,
			page,
			madeBy: MADE_BY,
			content: await pack(content),
		}))
	);

	await prisma.$transaction([
		prisma.yPostDiffPageCache.deleteMany({ where: { olderId, newerId } }),
		prisma.yPostDiffPageCache.createMany({ data }),
	]);
};
