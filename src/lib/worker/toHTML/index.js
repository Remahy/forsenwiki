import { Worker } from 'node:worker_threads';

import { dev } from '$app/environment';

// @ts-ignore
import workerPath from './worker?modulePath';

/**
 * @param {{ config: 'article' | 'diff', update?: string, content?: string }} workerData
 * @returns {Promise<string>}
 */
export default async function toHTML(workerData) {
	if (dev) {
		const { toHTMLWorker } = await import('./worker');
		return toHTMLWorker(workerData);
	}

	return new Promise((resolve, reject) => {
		const w = new Worker(workerPath, { workerData });

		w.on('message', resolve);
		w.on('error', reject);

		w.on('exit', (/** @type {number} */ code) => {
			if (code !== 0) {
				reject(new Error(`Worker stopped with exit code ${code}`));
			}
		});
	});
}
