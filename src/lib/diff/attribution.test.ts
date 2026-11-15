import { expect, test } from 'vitest';

import { attributeBlocks } from './attribution';

const version = (by: string, at: number, blocks: Record<string, string>) => ({
	by,
	at,
	blocks: Object.entries(blocks) as Array<[string, string]>,
});

test('a block is attributed to who last changed it, and a removed one to who removed it', () => {
	const { blocks, removed } = attributeBlocks([
		version('alice', 1000, { kept: 'a', edited: 'a', twice: 'a', gone: 'a' }),
		version('bob', 2000, { kept: 'a', edited: 'b', twice: 'b', gone: 'a', added: 'a' }),
		version('carol', 3000, { kept: 'a', edited: 'b', twice: 'c', added: 'a' }),
	]);

	expect(blocks).toEqual({
		edited: { by: 'bob', at: 2000 },
		twice: { by: 'carol', at: 3000 },
		added: { by: 'bob', at: 2000 },
	});
	expect(removed).toEqual({ gone: { by: 'carol', at: 3000 } });
});

test('a block that was removed and put back is attributed to who put it back', () => {
	const { blocks, removed } = attributeBlocks([
		version('alice', 1000, { block: 'a' }),
		version('bob', 2000, {}),
		version('carol', 3000, { block: 'a' }),
	]);

	expect(blocks).toEqual({ block: { by: 'carol', at: 3000 } });
	expect(removed).toEqual({});
});

test('blocks without an id are left out', () => {
	const { blocks, removed } = attributeBlocks([
		{ by: 'alice', at: 1000, blocks: [[null, 'a']] },
		{ by: 'bob', at: 2000, blocks: [[null, 'b']] },
	]);

	expect(blocks).toEqual({});
	expect(removed).toEqual({});
});
