import { dev } from '$app/environment';

import { createKeepAliveWorker } from '../keepAliveWorker';

// @ts-ignore
import workerPath from './worker?modulePath';

/**
 * @typedef {{ html: string, text: string, image?: string }} ToHTMLResult
 * @typedef {{ config: 'article', update: string, format?: import('$lib/y/rows').YPostUpdateFormat } | { config: 'article', content: string }} ToHTMLData
 * @typedef {Parameters<typeof import('./worker').readVersion>[0]} VersionData
 * @typedef {Awaited<ReturnType<typeof import('./worker').readVersion>>} Version
 * @typedef {Parameters<typeof import('./worker').compareVersions>[0]} CompareData
 * @typedef {Awaited<ReturnType<typeof import('./worker').compareVersions>>} Compared
 * @typedef {Parameters<typeof import('./worker').renderRows>[0]} RenderData
 * @typedef {Awaited<ReturnType<typeof import('./worker').renderRows>>} RenderedRows
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
 * @param {CompareData} data
 * @returns {Promise<Compared>}
 */
export const compareVersions = (data) => work({ job: 'compare', ...data });

/**
 * @param {RenderData} data
 * @returns {Promise<RenderedRows>}
 */
export const renderRows = (data) => work({ job: 'render', ...data });
