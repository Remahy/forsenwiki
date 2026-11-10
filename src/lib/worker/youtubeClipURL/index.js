import { dev } from '$app/environment';

import { createKeepAliveWorker } from '../keepAliveWorker';

// @ts-ignore
import workerPath from './worker?modulePath';

/** @type {(data: { url: string }) => Promise<string>} */
const run = createKeepAliveWorker(workerPath, { name: 'youtubeClipURL' });

/**
 * @param {{ url: string }} workerData
 * @returns {Promise<string>}
 */
export default async function youtubeClipURL(workerData) {
	if (dev) {
		const { youtubeClipURLWorker } = await import('./worker');
		return youtubeClipURLWorker(workerData);
	}

	return run(workerData);
}
