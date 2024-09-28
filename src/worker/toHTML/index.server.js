import worker from './toHTML.server?nodeWorker';

/**
 * @param {{ config: 'article' | 'diff', update?: string, content?: string }} workerData
 * @returns {Promise<string>}
 */
export default function toHTML(workerData) {
	return new Promise((resolve, reject) => {
		const w = worker({ workerData });

		w.on('message', resolve);
		w.on('error', reject);

		w.on('exit', (code) => {
			if (code !== 0) {
				reject(new Error(`Worker stopped with exit code ${code}`));
			}
		});
	});
}
