/**
 * @template T
 * @param {() => string | null | undefined} getQuery
 * @param {(query: string, signal: AbortSignal) => Promise<T>} fetcher
 * @param {object} options
 * @param {T} options.initialValue
 * @param {number} [options.delay=750]  Debounce delay in ms.
 * @param {string} [options.errorMessage='Search returned an error.']
 */
export function createDebouncedSearch(
	getQuery,
	fetcher,
	{ initialValue, delay = 750, errorMessage = 'Search returned an error.' }
) {
	/** @type {T} */
	let results = $state(initialValue);
	let isSearching = $state(false);
	let error = $state('');

	$effect(() => {
		const q = (getQuery() ?? '').trim();

		if (!q) {
			results = initialValue;
			isSearching = false;
			error = '';
			return;
		}

		isSearching = true;
		error = '';

		const controller = new AbortController();

		const handler = setTimeout(async () => {
			try {
				const data = await fetcher(q, controller.signal);

				if (!controller.signal.aborted) {
					results = data;
				}
			} catch (err) {
				if (controller.signal.aborted) {
					return;
				}

				console.error(err);
				error = errorMessage;
			} finally {
				if (!controller.signal.aborted) {
					isSearching = false;
				}
			}
		}, delay);

		// Runs when the query changes or the component is destroyed.
		return () => {
			clearTimeout(handler);
			controller.abort();
		};
	});

	return {
		get results() {
			return results;
		},
		get isSearching() {
			return isSearching;
		},
		get error() {
			return error;
		},
	};
}
