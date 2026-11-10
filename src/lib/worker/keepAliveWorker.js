import { Worker } from 'node:worker_threads';

/**
 * @typedef {{ resolve: (result: any) => void, reject: (err: Error) => void, timeout: NodeJS.Timeout }} Job
 * @typedef {{ worker: Worker, jobs: Map<number, Job>, idleTimeout?: NodeJS.Timeout }} Instance
 */

/**
 * Starting a worker takes about a second (jsdom, Lexical), so one is kept alive between jobs.
 * The worker has to handle its jobs with `handleJobs` from worker/handleJobs.js.
 * @template Data, Result
 * @param {string} workerPath
 * @param {{ name: string, jobTimeout?: number, idleTimeout?: number }} options
 * @returns {(data: Data) => Promise<Result>}
 */
export function createKeepAliveWorker(
	workerPath,
	{ name, jobTimeout = 30_000, idleTimeout = 5 * 60_000 }
) {
	/** @type {Instance | null} */
	let current = null;
	let nextJobId = 0;

	const startWorker = () => {
		const worker = new Worker(workerPath);
		// Each worker has its own jobs, so a dying worker can't reject the jobs of its replacement.
		/** @type {Instance} */
		const self = { worker, jobs: new Map() };

		/** @param {Error} err */
		const fail = (err) => {
			if (current === self) {
				current = null;
			}

			clearTimeout(self.idleTimeout);

			for (const job of self.jobs.values()) {
				clearTimeout(job.timeout);
				job.reject(err);
			}

			self.jobs.clear();
		};

		worker.on(
			'message',
			(
				/** @type {{ id: number, result: Result, error: null } | { id: number, error: string }} */ msg
			) => {
				const job = self.jobs.get(msg.id);

				if (!job) {
					return;
				}

				self.jobs.delete(msg.id);
				clearTimeout(job.timeout);

				if (msg.error === null) {
					job.resolve(msg.result);
				} else {
					job.reject(new Error(msg.error));
				}

				if (self.jobs.size === 0) {
					self.idleTimeout = setTimeout(() => {
						fail(new Error(`${name} worker stopped while idle`));
						worker.terminate();
					}, idleTimeout).unref();
				}
			}
		);

		worker.on('error', fail);
		worker.on('exit', (code) => fail(new Error(`${name} exited (code ${code}) without a result`)));

		// Don't keep the process alive just for an idle worker.
		worker.unref();

		return self;
	};

	return (data) => {
		current ??= startWorker();
		const self = current;
		clearTimeout(self.idleTimeout);

		const id = nextJobId++;

		return new Promise((resolve, reject) => {
			// A stuck job would block every job after it, so restart the worker instead.
			const timeout = setTimeout(() => {
				if (current === self) {
					current = null;
				}

				self.jobs.delete(id);
				reject(new Error(`${name} timed out after ${jobTimeout / 1000}s`));
				self.worker.terminate();
			}, jobTimeout);

			self.jobs.set(id, { resolve, reject, timeout });
			self.worker.postMessage({ id, data });
		});
	};
}
