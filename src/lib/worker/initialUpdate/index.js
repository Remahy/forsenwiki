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
		let settled = false;

		/** @param {() => void} fn */
		const settle = (fn) => {
			if (settled) {
				return;
			}

			settled = true;

			fn();

			w.terminate();
		};

		w.once('message', (/** @type {{ url: string, error: null } | { error: string }} */ msg) => {
			settle(() => (msg.error === null ? resolve(msg.url) : reject(new Error(msg.error))));
		});

		w.once('error', (err) => settle(() => reject(err)));

		w.once('exit', (code) => {
			settle(() => reject(new Error(`initialUpdateWorker exited (code ${code}) without a result`)));
		});
	});
}
