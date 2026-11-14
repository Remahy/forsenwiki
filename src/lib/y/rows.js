/**
 * @typedef {'YJS13' | 'LEXICAL_Y'} YPostUpdateFormat
 * @typedef {{ format: YPostUpdateFormat }} FormattedRow
 */

export const YJS13 = /** @type {const} */ ('YJS13');
export const LEXICAL_Y = /** @type {const} */ ('LEXICAL_Y');

/**
 * @template {FormattedRow} T
 * @param {T[]} rows
 */
export const currentRows = (rows) => rows.filter((row) => row.format === LEXICAL_Y);

/**
 * @template {FormattedRow} T
 * @param {T[]} rows
 * @param {number} index
 */
export const rowsForHistory = (rows, index) => {
	const { format } = rows[index];

	return { format, rows: rows.slice(0, index + 1).filter((row) => row.format === format) };
};

/**
 * @template {FormattedRow & { content: string }} T
 * @param {T[]} rows
 */
export const readableRows = (rows) => {
	const current = currentRows(rows);
	const format = current.length ? LEXICAL_Y : YJS13;

	return {
		format,
		rows: current.length ? current : rows.filter((row) => row.format === YJS13 && row.content),
	};
};

export const NOT_CONVERTED_MESSAGE =
	"This article has not been moved to the new editor yet, so it can't be edited. It can still be read.";

export const NOT_COMPARABLE_MESSAGE = 'This version is too old to be compared.';

/**
 * @param {...(FormattedRow | undefined)} rows
 */
export const canDiff = (...rows) => rows.every((row) => row?.format === LEXICAL_Y);
