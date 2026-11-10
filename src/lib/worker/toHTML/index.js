import { dev } from '$app/environment';

import { createKeepAliveWorker } from '../keepAliveWorker';

// @ts-ignore
import workerPath from './worker?modulePath';

/**
 * @typedef {{ html: string, text: string, image?: string }} ToHTMLResult
 * @typedef {{ config: 'article' | 'diff', update: string, format?: import('$lib/y/rows').YPostUpdateFormat } | { config: 'article' | 'diff', content: string }} ToHTMLData
 */

/** @type {(data: ToHTMLData) => Promise<ToHTMLResult>} */
const run = createKeepAliveWorker(workerPath, { name: 'toHTML' });

/**
 * @param {ToHTMLData} workerData
 * @returns {Promise<ToHTMLResult>}
 */
export default async function toHTML(workerData) {
	if (dev) {
		const { toHTMLWorker } = await import('./worker');

		// @ts-ignore
		const data = await toHTMLWorker(workerData);

		return data;
	}

	return run(workerData);
}
