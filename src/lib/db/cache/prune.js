import { subMonths } from 'date-fns';

import prisma from '$lib/prisma.server';

import { MADE_BY } from './pack';

const DAY = 24 * 60 * 60 * 1000;

/**
 * @param {Date} [now]
 * @returns {Promise<number>} The deleted rows.
 */
export const pruneCaches = async (now = new Date()) => {
	const where = { madeBy: { not: MADE_BY }, createdTimestamp: { lt: subMonths(now, 1) } };

	const [states, pages] = await prisma.$transaction([
		prisma.yPostUpdateStateCache.deleteMany({ where }),
		prisma.yPostDiffPageCache.deleteMany({ where }),
	]);

	return states.count + pages.count;
};

export const startCachePruning = () => {
	const prune = () =>
		pruneCaches().then(
			(count) => count && console.log(`Deleted ${count} outdated diff cache rows.`),
			(err) => console.error('Could not delete outdated diff cache rows.', err)
		);

	prune();
	setInterval(prune, DAY).unref();
};
