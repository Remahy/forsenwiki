import { createState } from 'lexical';

export const DIFF_STATE_KEY = 'diff';

/**
 * @typedef {Record<string, { __old?: unknown, __new?: unknown }>} DiffFields
 * @typedef {{ type: 'insert' | 'delete' | 'change', by?: string, at?: number, fields?: DiffFields }} DiffMark
 */

const TYPES = ['insert', 'delete', 'change'];

/**
 * @param {unknown} value
 * @returns {DiffMark | null}
 */
const parse = (value) => {
	let mark = value;

	if (typeof value === 'string') {
		try {
			mark = JSON.parse(value);
		} catch {
			return null;
		}
	}

	if (
		typeof mark !== 'object' ||
		mark === null ||
		!TYPES.includes(/** @type {any} */ (mark).type)
	) {
		return null;
	}

	return /** @type {DiffMark} */ (mark);
};

export const diffState = createState(DIFF_STATE_KEY, {
	parse,
	unparse: (mark) => (mark ? JSON.stringify(mark) : null),
});
