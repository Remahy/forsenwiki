import { Worker } from 'node:worker_threads';

import { dev } from '$app/environment';

// @ts-ignore
import workerPath from './worker?modulePath';

/**
 * @param {{ config: 'article' | 'diff', update: string } | { config: 'article' | 'diff', content: string }} workerData
 * @returns {Promise<{ html: string, text: string, image?: string }>}
 */
export default async function toHTML(workerData) {
	if (dev) {
		const { toHTMLWorker } = await import('./worker');

		// @ts-ignore
		const data = await toHTMLWorker(workerData);

		return data;
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
			(
				/** @type {{ html: string, text: string, image?: string, error: null } | { error: string }} */ msg
			) => {
				settle(() => (msg.error === null ? resolve(msg) : reject(new Error(msg.error))));
			}
		);

		w.once('error', (err) => settle(() => reject(err)));

		w.once('exit', (code) => {
			settle(() => reject(new Error(`toHTML exited (code ${code}) without a result`)));
		});
	});
}
