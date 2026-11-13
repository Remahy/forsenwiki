import { dev } from '$app/environment';

import { createKeepAliveWorker } from '../keepAliveWorker';

// @ts-ignore
import workerPath from './worker?modulePath';

/**
 * @typedef {{ html: string, text: string, image?: string }} ToHTMLResult
 * @typedef {{ config: 'article', update: string, format?: import('$lib/y/rows').YPostUpdateFormat } | { config: 'article', content: string }} ToHTMLData
 * @typedef {Parameters<typeof import('./worker').readVersion>[0]} VersionData
 * @typedef {Awaited<ReturnType<typeof import('./worker').readVersion>>} Version
 * @typedef {Parameters<typeof import('./worker').renderDiff>[0]} DiffData
 * @typedef {Awaited<ReturnType<typeof import('./worker').renderDiff>>} RenderedDiff
 */

/** @type {(data: any) => Promise<any>} */
const run = createKeepAliveWorker(workerPath, { name: 'toHTML' });

/**
 * @param {any} workerData
 */
const work = async (workerData) => {
	if (dev) {
		const { toHTMLWorker } = await import('./worker');

		// @ts-ignore
		return toHTMLWorker(workerData);
	}

	return run(workerData);
};

/**
 * @param {ToHTMLData} workerData
 * @returns {Promise<ToHTMLResult>}
 */
export default function toHTML(workerData) {
	return work(workerData);
}

/**
 * @param {VersionData} data
 * @returns {Promise<Version>}
 */
export const readVersion = (data) => work({ job: 'version', ...data });

/**
 * @param {DiffData} data
 * @returns {Promise<RenderedDiff>}
 */
export const renderDiff = (data) => work({ job: 'diff', ...data });
