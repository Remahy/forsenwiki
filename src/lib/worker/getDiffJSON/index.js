import { Worker } from 'node:worker_threads';

import { dev } from '$app/environment';

// @ts-ignore
import workerPath from './worker?modulePath';

/**
 * @param {{ updatesTo: Uint8Array<ArrayBufferLike>, updatesFrom: Uint8Array<ArrayBufferLike> }} workerData
 * @returns {Promise<string>}
 */
export default async function getDiffJSON(workerData) {
	if (dev) {
		const { getDiffJSONWorker } = await import('./worker');
		return getDiffJSONWorker(workerData);
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
