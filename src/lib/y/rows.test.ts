import { expect, test } from 'vitest';

import { canDiff, currentRows, LEXICAL_Y, readableRows, rowsForHistory, YJS13 } from './rows';

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

test('only @lexical/y versions can be compared', () => {
	expect(canDiff(rows[2], rows[3])).toBe(true);
	expect(canDiff(rows[1], rows[2])).toBe(false);
	expect(canDiff(rows[0], rows[1])).toBe(false);
	expect(canDiff(rows[3], undefined)).toBe(false);
});

test('an article is read from its @lexical/y rows, or from its Yjs 13 rows while it has none', () => {
	const stored = rows.map((row) => ({ ...row, content: row.id }));

	expect(readableRows(stored)).toEqual({ format: LEXICAL_Y, rows: stored.slice(2) });
	expect(readableRows(stored.slice(0, 2))).toEqual({ format: YJS13, rows: stored.slice(0, 2) });
	expect(readableRows([{ format: YJS13, content: '' }])).toEqual({ format: YJS13, rows: [] });
});
