import prisma from '$lib/prisma.server';

import { MADE_BY, pack, unpack } from './pack';

/**
 * @typedef {import('$lib/worker/toHTML').Version} VersionState
 */

/**
 * @param {string} postUpdateId
 * @returns {Promise<VersionState | null>}
 */
export const readVersionState = async (postUpdateId) => {
	const row = await prisma.yPostUpdateStateCache.findUnique({ where: { postUpdateId } });

	return row?.madeBy === MADE_BY ? unpack(row.content) : null;
};

/**
 * @param {string} postUpdateId
 * @param {VersionState} state
 */
export const writeVersionState = async (postUpdateId, { json, blocks, article }) => {
	const data = { madeBy: MADE_BY, content: await pack({ json, blocks, article }) };

	await prisma.yPostUpdateStateCache.upsert({
		where: { postUpdateId },
		create: { postUpdateId, ...data },
		update: data,
	});
};
