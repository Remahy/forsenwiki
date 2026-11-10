import { expect, test } from 'vitest';

import { currentRows, LEXICAL_Y, rowsForHistory, YJS13 } from './rows';

const rows = [
	{ id: 'a', format: YJS13 },
	{ id: 'b', format: YJS13 },
	{ id: 'seed', format: LEXICAL_Y },
	{ id: 'c', format: LEXICAL_Y },
];

test('the current state is the @lexical/y chain only', () => {
	expect(currentRows(rows).map(({ id }) => id)).toEqual(['seed', 'c']);
	expect(currentRows(rows.slice(0, 2))).toEqual([]);
});

test('history before the seed reads the Yjs 13 rows up to that point', () => {
	expect(rowsForHistory(rows, 1)).toEqual({ format: YJS13, rows: rows.slice(0, 2) });
	expect(rowsForHistory(rows, 0)).toEqual({ format: YJS13, rows: rows.slice(0, 1) });
});

test('history from the seed on reads the @lexical/y rows up to that point', () => {
	expect(rowsForHistory(rows, 2)).toEqual({ format: LEXICAL_Y, rows: [rows[2]] });
	expect(rowsForHistory(rows, 3)).toEqual({ format: LEXICAL_Y, rows: rows.slice(2) });
});
