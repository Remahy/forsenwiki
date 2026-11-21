import { expect, test } from 'vitest';

import { parseCursor, toCursor } from './cursor';

test('a result read back from JSON gives the same cursor as on the server', () => {
	const createdTimestamp = new Date('2026-11-21T15:39:03.123Z');
	const fromJSON = JSON.parse(JSON.stringify({ createdTimestamp, id: 'cmhz0abc123' }));

	expect(parseCursor(toCursor(fromJSON))).toEqual({ createdTimestamp, id: 'cmhz0abc123' });
});

test('a missing or broken cursor starts from the top', () => {
	expect(parseCursor(null)).toBeNull();
	expect(parseCursor('')).toBeNull();
	expect(parseCursor('cmhz0abc123')).toBeNull();
	expect(parseCursor('yesterday_cmhz0abc123')).toBeNull();
	expect(parseCursor('2026-11-21T15:39:03.123Z_')).toBeNull();
});
