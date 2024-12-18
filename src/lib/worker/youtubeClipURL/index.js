// @ts-ignore
import worker from './worker?nodeWorker';

/**
 * @param {{ url: string }} workerData
 * @returns {Promise<string>}
 */
export default function youtubeClipURL(workerData) {
	return new Promise((resolve, reject) => {
		const w = worker({ workerData });

		w.on('message', resolve);
		w.on('error', reject);

		w.on('exit', (/** @type {number} */ code) => {
			if (code !== 0) {
				reject(new Error(`Worker stopped with exit code ${code}`));
			}
		});
	});
}
