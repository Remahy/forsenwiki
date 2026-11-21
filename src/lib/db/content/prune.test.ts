import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { STATIC_DOMAIN } from '$lib/environment/environment';
import { pruneUnuploadedContent } from './prune';

type Row = {
	id: string;
	hash: string;
	type: string | null;
	createdTimestamp: Date;
	activities: number;
	usages: number;
};

type Where = {
	createdTimestamp: { lt: Date };
	activities: { none: object };
	usedIn: { none: object };
	OR: Array<{ type: null } | { type: { not: string } }>;
	id?: { in: string[] };
};

const rows = vi.hoisted(() => new Map<string, Row>());

vi.mock('$lib/prisma.server', () => {
	const matches = (row: Row, where: Where) =>
		row.createdTimestamp < where.createdTimestamp.lt &&
		row.activities === 0 &&
		row.usages === 0 &&
		where.OR.some((condition) =>
			condition.type === null ? row.type === null : row.type !== condition.type.not
		) &&
		(!where.id || where.id.in.includes(row.id));

	return {
		default: {
			content: {
				findMany: async ({ where }: { where: Where }) =>
					[...rows.values()].filter((row) => matches(row, where)),
				deleteMany: async ({ where }: { where: Where }) => {
					const deleted = [...rows.values()].filter((row) => matches(row, where));
					deleted.forEach(({ id }) => rows.delete(id));

					return { count: deleted.length };
				},
			},
		},
	};
});

const NOW = new Date('2026-11-21T12:00:00Z');
const A_DAY_AGO = new Date('2026-11-20T11:00:00Z');
const AN_HOUR_AGO = new Date('2026-11-21T11:00:00Z');

/** What storage answers for each hash, or throws for a network error. */
const storage = new Map<string, number | Error>();

const row = (id: string, storageAnswer: number | Error, overrides: Partial<Row> = {}) => {
	const hash = `${id}-hash`;
	rows.set(id, {
		id,
		hash,
		type: 'image',
		createdTimestamp: A_DAY_AGO,
		activities: 0,
		usages: 0,
		...overrides,
	});
	storage.set(hash, storageAnswer);
};

beforeEach(() => {
	rows.clear();
	storage.clear();

	vi.stubGlobal(
		'fetch',
		vi.fn(async (url: string) => {
			const answer = storage.get(url.slice(`${STATIC_DOMAIN}/`.length));

			if (answer instanceof Error) {
				throw answer;
			}

			// Confirmed while the cleanup was checking storage.
			if (url.endsWith('confirmed-meanwhile-hash')) {
				rows.get('confirmed-meanwhile')!.activities = 1;
			}

			return { status: answer };
		})
	);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

test('uploads that never reached storage within a day are deleted', async () => {
	row('missing', 404);

	expect(await pruneUnuploadedContent(NOW)).toBe(1);
	expect(rows.has('missing')).toBe(false);
});

test('only a missing file deletes, a file in storage or a failed check keeps the row', async () => {
	row('in-storage', 200);
	row('storage-error', 500);
	row('unreachable', new Error('network'));

	expect(await pruneUnuploadedContent(NOW)).toBe(0);
	expect([...rows.keys()]).toEqual(['in-storage', 'storage-error', 'unreachable']);
});

test('uploads still within their day, confirmed, used, or links are left alone', async () => {
	row('recent', 404, { createdTimestamp: AN_HOUR_AGO });
	row('confirmed', 404, { activities: 1 });
	row('used', 404, { usages: 1 });
	row('link', 404, { type: 'link' });

	expect(await pruneUnuploadedContent(NOW)).toBe(0);
	expect(rows.size).toBe(4);
	expect(fetch).not.toHaveBeenCalled();
});

test('an upload confirmed while storage was being checked is kept', async () => {
	row('confirmed-meanwhile', 404);

	expect(await pruneUnuploadedContent(NOW)).toBe(0);
	expect(rows.has('confirmed-meanwhile')).toBe(true);
});
