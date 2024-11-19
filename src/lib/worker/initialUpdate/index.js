// @ts-ignore
import worker from './worker?nodeWorker';

/**
 * @returns {Promise<string>}
 */
export default function initialUpdate() {
	return new Promise((resolve, reject) => {
		const w = worker();

		w.on('message', resolve);
		w.on('error', reject);

		w.on('exit', (/** @type {number} */ code) => {
			if (code !== 0) {
				reject(new Error(`Worker stopped with exit code ${code}`));
			}
		});
	});
}
