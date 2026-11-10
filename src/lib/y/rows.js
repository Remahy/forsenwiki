/**
 * @typedef {'YJS13' | 'LEXICAL_Y'} YPostUpdateFormat
 * @typedef {{ format: YPostUpdateFormat }} FormattedRow
 */

/** Rows written by the Yjs 13 editor (`@lexical/yjs`). Only read for history. */
export const YJS13 = /** @type {const} */ ('YJS13');
/** Rows written by the Yjs 14 editor (`@lexical/y`). The seed row starts the chain. */
export const LEXICAL_Y = /** @type {const} */ ('LEXICAL_Y');

/**
 * The rows that make up the article's current state.
 * @template {FormattedRow} T
 * @param {T[]} rows
 */
export const currentRows = (rows) => rows.filter((row) => row.format === LEXICAL_Y);

/**
 * The rows that make up the article as it was after `rows[index]`, and how to read them.
 * @template {FormattedRow} T
 * @param {T[]} rows
 * @param {number} index
 */
export const rowsForHistory = (rows, index) => {
	const { format } = rows[index];

	return { format, rows: rows.slice(0, index + 1).filter((row) => row.format === format) };
};
