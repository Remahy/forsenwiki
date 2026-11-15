import { beforeEach, expect, test, vi } from 'vitest';

import type { PageRow, StateRow } from '$lib/diff/fakePrisma';
import { readDiffPage, writeDiffPages } from './diffPages';
import { pruneCaches } from './prune';
import { readVersionState, writeVersionState } from './versionState';

const stored = vi.hoisted(() => ({
	stateRows: new Map<string, StateRow>(),
	pageRows: new Map<string, PageRow>(),
}));

vi.mock('$lib/prisma.server', async () => ({
	default: (await import('$lib/diff/fakePrisma')).fakePrisma(stored),
}));
vi.mock('$lib/utils/version', () => ({ version: 'this-version' }));

const NOW = new Date('2026-11-14T12:00:00Z');
const OVER_A_MONTH_AGO = new Date('2026-10-13T12:00:00Z');
const UNDER_A_MONTH_AGO = new Date('2026-10-15T12:00:00Z');

const content = new Uint8Array();

const state = (postUpdateId: string, madeBy: string, createdTimestamp: Date) =>
	stored.stateRows.set(postUpdateId, { postUpdateId, madeBy, content, createdTimestamp });

const page = (olderId: string, madeBy: string, createdTimestamp: Date) =>
	stored.pageRows.set(`${olderId}:newer:0`, {
		olderId,
		newerId: 'newer',
		page: 0,
		madeBy,
		content,
		createdTimestamp,
	});

beforeEach(() => {
	stored.stateRows.clear();
	stored.pageRows.clear();
	vi.useRealTimers();
});

test('only rows of another version that are older than a month are deleted', async () => {
	for (const add of [state, page]) {
		add('old-and-outdated', 'an-older-version', OVER_A_MONTH_AGO);
		add('recent-and-outdated', 'an-older-version', UNDER_A_MONTH_AGO);
		add('old-and-current', 'this-version', OVER_A_MONTH_AGO);
		add('recent-and-current', 'this-version', UNDER_A_MONTH_AGO);
	}

	expect(await pruneCaches(NOW)).toBe(2);

	const kept = ['recent-and-outdated', 'old-and-current', 'recent-and-current'];

	expect([...stored.stateRows.keys()]).toEqual(kept);
	expect([...stored.pageRows.values()].map(({ olderId }) => olderId)).toEqual(kept);
});

test('nothing is deleted when nothing is outdated', async () => {
	state('current', 'this-version', OVER_A_MONTH_AGO);

	expect(await pruneCaches(NOW)).toBe(0);
	expect(stored.stateRows.size).toBe(1);
});

test('a row written again counts as new', async () => {
	vi.useFakeTimers({ now: OVER_A_MONTH_AGO });

	const version = { json: '{}', blocks: [], article: null } as never;
	const diffPage = { view: 'split', rows: [], pages: 1, total: 0, partial: false } as never;

	await writeVersionState('update', version);
	await writeDiffPages('older', 'newer', [diffPage]);

	vi.setSystemTime(NOW);

	await writeVersionState('update', version);
	await writeDiffPages('older', 'newer', [diffPage]);

	for (const row of [...stored.stateRows.values(), ...stored.pageRows.values()]) {
		row.madeBy = 'an-older-version';
	}

	expect(await pruneCaches(NOW)).toBe(0);
	expect(await readVersionState('update')).toBe(null);
	expect(await readDiffPage('older', 'newer', 0)).toBe(null);
});
