// https://stackoverflow.com/a/79329336
/**
 * @template {unknown[]} T
 * @param {(...args: T) => unknown} f
 * @param {number} ms
 * @returns {(...args: T) => void}
 */
export function debounce(f, ms) {
	/** @type {number | null} */
	let id = null;

	return (...args) => {
		if (id !== null) {
			clearTimeout(id);
		}

		id = window.setTimeout(() => {
			f(...args);
		}, ms);
	};
}
