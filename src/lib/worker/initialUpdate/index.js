import { dev } from '$app/environment';

import { createKeepAliveWorker } from '../keepAliveWorker';

// @ts-ignore
import workerPath from './worker?modulePath';

/** @type {(data: {}) => Promise<string>} */
const run = createKeepAliveWorker(workerPath, { name: 'initialUpdate', idleTimeout: 0 });

/** @type {Promise<string>?} */
let initialUpdatePromise = null;

/**
 * @returns {Promise<string>}
 */
export default function initialUpdate() {
	// Cache the promise, so concurrent first calls share one worker.
	initialUpdatePromise ??= (async () => {
		if (dev) {
			const { initialUpdateWorker } = await import('./worker');

			return initialUpdateWorker();
		}

		return run({});
	})();

	initialUpdatePromise.catch(() => {
		initialUpdatePromise = null;
	});

	return initialUpdatePromise;
}
