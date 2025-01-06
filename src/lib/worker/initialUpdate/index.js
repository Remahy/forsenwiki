import { Worker } from 'node:worker_threads';

import { dev } from '$app/environment';

// @ts-ignore
import workerPath from './worker?modulePath';

/** @type {string?} */
let initialUpdateString = null;

/**
 * @returns {Promise<string>}
 */
export default async function initialUpdate() {
	if (initialUpdateString) {
		return initialUpdateString;
	}

	if (dev) {
		const { initialUpdateWorker } = await import('./worker');

		/** @type {string} */
		const m = initialUpdateWorker();

		initialUpdateString = m;

		return initialUpdateString;
	}

	return new Promise((resolve, reject) => {
		const w = new Worker(workerPath, { workerData: {} });

		w.on('message', (m) => {
			initialUpdateString = m;
			resolve(m);
		});
		w.on('error', reject);

		w.on('exit', (/** @type {number} */ code) => {
			if (code !== 0) {
				reject(new Error(`Worker stopped with exit code ${code}`));
			}
		});
	});
}
