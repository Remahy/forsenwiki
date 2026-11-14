import { isMainThread, parentPort } from 'node:worker_threads';

/**
 * Does nothing when imported outside a worker, e.g. in dev mode.
 * @param {(data: any) => unknown} fn
 */
export const handleJobs = (fn) => {
	const port = parentPort;

	if (isMainThread || !port) {
		return;
	}

	port.on('message', async ({ id, data }) => {
		try {
			port.postMessage({ id, result: await fn(data), error: null });
		} catch (err) {
			port.postMessage({ id, error: String(/** @type {any} */ (err)?.message ?? err) });
		}
	});
};
