import { expect, test, vi } from 'vitest';

import { GET } from './+server';

const findUnique = vi.hoisted(() => vi.fn());

vi.mock('$lib/prisma.server', () => ({ default: { content: { findUnique } } }));

const request = (isModerator: boolean) =>
	GET({ params: { hash: 'a'.repeat(64) }, locals: { isModerator } } as never);

test('serializes content with a BigInt content length', async () => {
	findUnique.mockResolvedValueOnce({
		id: 'id',
		name: 'forsen.png',
		contentLength: 118346n,
		metadata: { width: 1 },
	});

	const res = await request(false);

	expect(res.status).toBe(200);
	expect(await res.json()).toEqual({
		id: 'id',
		name: 'forsen.png',
		contentLength: { $bigint: '118346' },
		metadata: {},
	});
});
