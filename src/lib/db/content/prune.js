import { subHours } from 'date-fns';

import { CLOUDFLARE_R2_SECRET_ACCESS_KEY } from '$env/static/private';
import { LINK_CONTENT_TYPE, UPLOAD_WINDOW_HOURS } from '$lib/constants/content';
import { STATIC_DOMAIN } from '$lib/environment/environment';
import prisma from '$lib/prisma.server';

const DAY = 24 * 60 * 60 * 1000;
const CHECKS_AT_ONCE = 20;

/**
 * @param {Date} now
 * @returns {Prisma.Prisma.ContentWhereInput}
 */
const unconfirmedUploads = (now) => ({
	createdTimestamp: { lt: subHours(now, UPLOAD_WINDOW_HOURS) },
	activities: { none: {} },
	usedIn: { none: {} },
	OR: [{ type: null }, { type: { not: LINK_CONTENT_TYPE } }],
});

/**
 * Only a 404 means the file is missing, anything else is checked again tomorrow.
 * @param {string} hash
 */
const isMissing = async (hash) => {
	try {
		const res = await fetch(`${STATIC_DOMAIN}/${hash}`, { method: 'HEAD' });

		return res.status === 404;
	} catch {
		return false;
	}
};

/**
 * @param {Date} [now]
 * @returns {Promise<number>} The deleted rows.
 */
export const pruneUnuploadedContent = async (now = new Date()) => {
	const candidates = await prisma.content.findMany({
		where: unconfirmedUploads(now),
		select: { id: true, hash: true },
	});

	/** @type {string[]} */
	const missing = [];
	for (let index = 0; index < candidates.length; index += CHECKS_AT_ONCE) {
		const batch = candidates.slice(index, index + CHECKS_AT_ONCE);
		const results = await Promise.all(batch.map(({ hash }) => isMissing(hash)));

		missing.push(...batch.filter((_content, at) => results[at]).map(({ id }) => id));
	}

	if (!missing.length) {
		return 0;
	}

	// Confirmed or used since it was listed is kept.
	const { count } = await prisma.content.deleteMany({
		where: { ...unconfirmedUploads(now), id: { in: missing } },
	});

	return count;
};

export const startContentPruning = () => {
	// Without storage nothing is ever uploaded, so every file would look missing.
	if (!CLOUDFLARE_R2_SECRET_ACCESS_KEY) {
		return;
	}

	const prune = () =>
		pruneUnuploadedContent().then(
			(count) => count && console.log(`Deleted ${count} uploads that never reached storage.`),
			(err) => console.error('Could not delete uploads that never reached storage.', err)
		);

	prune();
	setInterval(prune, DAY).unref();
};
