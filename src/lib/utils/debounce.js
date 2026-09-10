/**
 * @template {unknown[]} T
 * @param {(...args: T) => unknown} f
 * @param {number} ms
 * @param {number} [maxWait]
 * @returns {(...args: T) => void}
 */
export function debounce(f, ms, maxWait) {
	/** @type {number | null} */
	let id = null;
	/** @type {number | null} */
	let maxId = null;
	/** @type {T | null} */
	let args = null;

	const invoke = () => {
		if (id !== null) {
			clearTimeout(id);
			id = null;
		}

		if (maxId !== null) {
			clearTimeout(maxId);
			maxId = null;
		}

		const currentArgs = args;
		args = null;

		if (currentArgs !== null) {
			f(...currentArgs);
		}
	};

	return (...newArgs) => {
		args = newArgs;

		if (id !== null) {
			clearTimeout(id);
		}

		id = window.setTimeout(invoke, ms);

		if (maxWait !== undefined && maxId === null) {
			maxId = window.setTimeout(invoke, maxWait);
		}
	};
}
