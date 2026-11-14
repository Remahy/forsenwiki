import { compareVersions, readVersion, renderRows } from '$lib/worker/toHTML';
import toHTML from '$lib/worker/toHTML';
import { yPostUpdatesV2ToBase64 } from '$lib/y/utils';
import { readDiffPage, writeDiffPages } from '$lib/db/cache/diffPages';
import { readVersionState, writeVersionState } from '$lib/db/cache/versionState';

import { attributeBlocks } from './attribution';
import {
	ATTRIBUTION_BUDGET,
	COMPARE_BUDGET,
	LARGE_ARTICLE_BLOCKS,
	PAGE_ROWS,
	VERSION_CACHE_BYTES,
} from './constants';

/**
 * @typedef {import('$lib/worker/toHTML').Version} Version
 * @typedef {'split' | 'combined'} DiffView
 * @typedef {import('$lib/db/cache/diffPages').DiffPage} DiffPage
 * @typedef {{ view?: DiffView, html?: boolean }} PageOptions Without a view, a large article is shown combined.
 * @typedef {import('$lib/worker/toHTML').ToHTMLResult} ToHTMLResult
 * @typedef {{ id: string, content: string, createdTimestamp: Date, metadata: { userId: string } }} VersionRow
 */

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
	const cached = cache.get(id);

	if (cached?.article && !version.article) {
		version = { ...version, article: cached.article };
	}

	if (cached) {
		cachedBytes -= bytesOf(cached);
		cache.delete(id);
	}

	cache.set(id, version);
	cachedBytes += bytesOf(version);

	for (const [oldest, entry] of cache) {
		if (cachedBytes <= VERSION_CACHE_BYTES || oldest === id) {
			break;
		}

		cache.delete(oldest);
		cachedBytes -= bytesOf(entry);
	}

	return version;
};

/**
 * @param {unknown} error
 */
const reportCacheError = (error) => console.error('Diff cache:', error);

/** @type {Map<string, Promise<void>>} */
const storing = new Map();

/**
 * @param {string} id
 * @param {Version} version
 */
const store = (id, version) => {
	const pending = writeVersionState(id, version)
		.catch(reportCacheError)
		.finally(() => {
			if (storing.get(id) === pending) {
				storing.delete(id);
			}
		});

	storing.set(id, pending);
};

/**
 * @param {string} id
 * @returns {Promise<Version | undefined>}
 */
const stored = async (id) => {
	await storing.get(id);

	const state = await readVersionState(id).catch(reportCacheError);

	return state ?? undefined;
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
	const cached = cache.get(id) ?? (await stored(id));

	if (cached && (cached.article || !html)) {
		return remember(id, cached);
	}

	if (cached) {
		const version = {
			...cached,
			article: await toHTML({ config: 'article', content: cached.json }),
		};

		store(id, version);

		return remember(id, version);
	}

	const key = `${id}:${html}`;
	const pending =
		reading.get(key) ??
		readVersion({ update: stateOf(rows.slice(0, index + 1)), html })
			.then((version) => {
				store(id, version);

				return remember(id, version);
			})
			.finally(() => reading.delete(key));

	reading.set(key, pending);

	return pending;
};

/**
 * @param {VersionRow[]} rows
 * @param {number} olderIndex
 * @param {number} newerIndex
 * @param {number} deadline
 */
const attribute = async (rows, olderIndex, newerIndex, deadline) => {
	const author = (/** @type {number} */ index) => ({
		by: rows[index].metadata.userId,
		at: rows[index].createdTimestamp.getTime(),
	});

	if (newerIndex - olderIndex === 1) {
		return { author: author(newerIndex) };
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
 * @param {number} rows
 */
const pagesFor = (rows) => Math.max(1, Math.ceil(rows / PAGE_ROWS));

/** @type {Map<string, Promise<DiffPage[]>>} */
const comparing = new Map();
/** @type {Map<string, Promise<void>>} */
const writing = new Map();

/**
 * @param {VersionRow[]} rows
 * @param {number} olderIndex
 * @param {number} newerIndex
 * @param {PageOptions} options
 * @returns {Promise<DiffPage[]>}
 */
const compare = async (rows, olderIndex, newerIndex, { view: requestedView, html }) => {
	const started = performance.now();

	const [older, newer] = await Promise.all([
		getVersion(rows, olderIndex),
		getVersion(rows, newerIndex, { html }),
	]);

	const attribution = await attribute(rows, olderIndex, newerIndex, started + ATTRIBUTION_BUDGET);

	const large = Math.max(older.blocks.length, newer.blocks.length) >= LARGE_ARTICLE_BLOCKS;
	const view = requestedView ?? (large ? 'combined' : 'split');

	const { rows: changed, partial } = await compareVersions({
		older: older.json,
		newer: newer.json,
		view,
		timeout: COMPARE_BUDGET,
		...attribution,
	});

	const count = pagesFor(changed.length);

	return Array.from({ length: count }, (_, page) => ({
		view,
		rows: changed.slice(page * PAGE_ROWS, (page + 1) * PAGE_ROWS),
		pages: count,
		total: changed.length,
		partial,
		attributed: Object.keys(attribution).length > 0,
	}));
};

/**
 * @param {VersionRow[]} rows
 * @param {number} olderIndex
 * @param {number} newerIndex
 * @param {number} page
 * @param {PageOptions} [options]
 * @returns {Promise<DiffPage>}
 */
const pageOf = async (rows, olderIndex, newerIndex, page, options = {}) => {
	const { view } = options;
	const olderId = rows[olderIndex].id;
	const newerId = rows[newerIndex].id;
	const key = `${olderId}:${newerId}`;

	await writing.get(key);

	const kept = await readDiffPage(olderId, newerId, page).catch(reportCacheError);

	if (
		kept &&
		kept.pages === pagesFor(kept.total) &&
		(!view || kept.view === view) &&
		(page > 0 || kept.attributed)
	) {
		return kept;
	}

	const pending =
		comparing.get(key) ??
		compare(rows, olderIndex, newerIndex, options)
			.then((pages) => {
				writing.set(
					key,
					writeDiffPages(olderId, newerId, pages)
						.catch(reportCacheError)
						.finally(() => writing.delete(key))
				);

				return pages;
			})
			.finally(() => comparing.delete(key));

	comparing.set(key, pending);

	const pages = await pending;

	return pages[page] ?? { ...pages[0], rows: [] };
};

/**
 * @param {DiffPage} found
 * @param {number} page
 */
const rendered = async (found, page) => ({
	changes: await renderRows({ rows: found.rows }),
	page,
	pages: found.pages,
	total: found.total,
	view: found.view,
	partial: found.partial,
	attributed: found.attributed,
});

/**
 * A later page of the changed blocks of {@link diffVersions}.
 * @param {VersionRow[]} rows
 * @param {number} olderIndex
 * @param {number} newerIndex
 * @param {number} page
 */
export const diffPage = async (rows, olderIndex, newerIndex, page) =>
	rendered(await pageOf(rows, olderIndex, newerIndex, page), page);

/**
 * @param {VersionRow[]} rows
 * @param {number} olderIndex
 * @param {number} newerIndex
 * @param {{ article?: ToHTMLResult | null, view?: DiffView }} [options]
 */
export const diffVersions = async (rows, olderIndex, newerIndex, options = {}) => {
	const found = await pageOf(rows, olderIndex, newerIndex, 0, {
		view: options.view,
		html: !options.article,
	});

	const [first, article] = await Promise.all([
		rendered(found, 0),
		options.article ??
			getVersion(rows, newerIndex, { html: true }).then((version) => version.article),
	]);

	return { ...first, article: /** @type {ToHTMLResult} */ (article) };
};
