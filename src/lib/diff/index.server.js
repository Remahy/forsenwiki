import { readVersion, renderDiff } from '$lib/worker/toHTML';
import toHTML from '$lib/worker/toHTML';
import { yPostUpdatesV2ToBase64 } from '$lib/y/utils';

import { attributeBlocks } from './attribution';

/**
 * @typedef {import('$lib/worker/toHTML').Version} Version
 * @typedef {import('$lib/worker/toHTML').ToHTMLResult} ToHTMLResult
 * @typedef {{ id: string, content: string, createdTimestamp: Date, metadata: { userId: string } }} VersionRow
 */

export const DIFF_BUDGET = 5000;
const COMPARE_BUDGET = 1500;
const RENDER_RESERVE = 1000;
const ATTRIBUTION_BUDGET = DIFF_BUDGET - COMPARE_BUDGET - RENDER_RESERVE;

const LARGE_ARTICLE_BLOCKS = 5000;

const CACHE_BYTES = 64 * 1024 * 1024;

/** @type {Map<string, Version>} */
const cache = new Map();
/** @type {Map<string, Promise<Version>>} */
const reading = new Map();
let cachedBytes = 0;

/**
 * @param {Version} version
 */
const bytesOf = (version) => version.json.length + (version.article?.html.length ?? 0);

/**
 * @param {string} id
 * @param {Version} version
 */
const remember = (id, version) => {
	const known = cache.get(id);

	if (known) {
		cachedBytes -= bytesOf(known);
		cache.delete(id);
	}

	cache.set(id, version);
	cachedBytes += bytesOf(version);

	for (const [oldest, entry] of cache) {
		if (cachedBytes <= CACHE_BYTES || oldest === id) {
			break;
		}

		cache.delete(oldest);
		cachedBytes -= bytesOf(entry);
	}

	return version;
};

/**
 * @param {VersionRow[]} rows
 * @returns {string} A base64 V2 update.
 */
const stateOf = (rows) => (rows.length === 1 ? rows[0].content : yPostUpdatesV2ToBase64(rows));

/**
 * @param {VersionRow[]} rows
 * @param {number} index
 * @param {{ html?: boolean }} [options]
 * @returns {Promise<Version>}
 */
export const getVersion = async (rows, index, { html = false } = {}) => {
	const { id } = rows[index];
	const known = cache.get(id);

	if (known && (known.article || !html)) {
		return remember(id, known);
	}

	if (known) {
		const article = await toHTML({ config: 'article', content: known.json });

		return remember(id, { ...known, article });
	}

	const key = `${id}:${html}`;
	const pending =
		reading.get(key) ??
		readVersion({ update: stateOf(rows.slice(0, index + 1)), html })
			.then((version) => remember(id, version))
			.finally(() => reading.delete(key));

	reading.set(key, pending);

	return pending;
};

/**
 * @param {VersionRow[]} rows
 * @param {number} olderIndex
 * @param {number} newerIndex
 * @param {number} deadline
 * @param {boolean} large Reading every version in between is not worth its time.
 */
const attribute = async (rows, olderIndex, newerIndex, deadline, large) => {
	const author = (/** @type {number} */ index) => ({
		by: rows[index].metadata.userId,
		at: rows[index].createdTimestamp.getTime(),
	});

	if (newerIndex - olderIndex === 1) {
		return { author: author(newerIndex) };
	}

	if (large) {
		return {};
	}

	const versions = [];

	for (let index = olderIndex; index <= newerIndex; index++) {
		if (performance.now() > deadline && !cache.has(rows[index].id)) {
			return {};
		}

		const version = await getVersion(rows, index);

		versions.push({ blocks: version.blocks, ...author(index) });
	}

	return attributeBlocks(versions);
};

/**
 * @param {VersionRow[]} rows
 * @param {number} olderIndex
 * @param {number} newerIndex
 * @param {{ article?: ToHTMLResult | null }} [options]
 */
export const diffVersions = async (rows, olderIndex, newerIndex, { article = null } = {}) => {
	const started = performance.now();
	const renderDeadline = Date.now() + DIFF_BUDGET - RENDER_RESERVE;

	const [older, newer] = await Promise.all([
		getVersion(rows, olderIndex),
		getVersion(rows, newerIndex, { html: !article }),
	]);

	const large = Math.max(older.blocks.length, newer.blocks.length) >= LARGE_ARTICLE_BLOCKS;
	const attribution = await attribute(
		rows,
		olderIndex,
		newerIndex,
		started + ATTRIBUTION_BUDGET,
		large
	);

	const { changes, partial, omitted } = await renderDiff({
		older: older.json,
		newer: newer.json,
		timeout: COMPARE_BUDGET,
		deadline: renderDeadline,
		...attribution,
	});

	return {
		changes,
		partial,
		omitted,
		large,
		attributed: Object.keys(attribution).length > 0,
		article: /** @type {ToHTMLResult} */ (article ?? newer.article),
	};
};
