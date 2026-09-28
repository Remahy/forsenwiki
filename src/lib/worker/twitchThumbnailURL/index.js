import { Worker } from 'node:worker_threads';
import { dev } from '$app/environment';

// @ts-ignore
import workerPath from './worker?modulePath';

/**
 * @param {{ url: string }} workerData
 * @returns {Promise<string | null>}
 */
export default async function twitchThumbnailURL(workerData) {
	if (dev) {
		const { twitchThumbnailURLWorker } = await import('./worker');
		return twitchThumbnailURLWorker(workerData);
	}

	return new Promise((resolve, reject) => {
		const w = new Worker(workerPath, { workerData });
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

		w.once(
			'message',
			(/** @type {{ url: string, error: null } | { url: null, error: string }} */ msg) => {
				settle(() => (msg.error === null ? resolve(msg.url) : reject(new Error(msg.error))));
			}
		);

		w.once('error', (err) => settle(() => reject(err)));

		w.once('exit', (code) => {
			settle(() => reject(new Error(`twitchThumbnailURL exited (code ${code}) without a result`)));
		});
	});
}
