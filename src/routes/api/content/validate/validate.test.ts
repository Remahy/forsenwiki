import { expect, test, vi } from 'vitest';

import { _validateContent } from './+server';

const findMany = vi.hoisted(() => vi.fn(async () => []));

vi.mock('$lib/prisma.server', () => ({ default: { content: { findMany } } }));

const file = (hash: string) => ({
	name: 'forsen.png',
	mimetype: 'image/png',
	contentLength: 1,
	fileSnippet: 'AA==',
	hash,
});

test('only lowercase hex SHA-256 hashes are uploads, so a link hash cannot be claimed', async () => {
	const hex = 'a'.repeat(64);

	const { status, errors } = await _validateContent(
		[file(`link:${hex}`), file(hex.toUpperCase()), file('a'.repeat(63))],
		false
	);

	expect(status).toBe(400);
	expect(errors.map(({ index }) => index)).toEqual([0, 1, 2]);
	expect(findMany).not.toHaveBeenCalled();
});
