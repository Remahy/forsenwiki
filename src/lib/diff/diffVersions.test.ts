import * as Y from '@y/y';
import { expect, test, vi } from 'vitest';
import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical';
import { $createListItemNode, $createListNode } from '@lexical/list';
import { uint8ArrayToBase64 } from 'uint8array-extras';

import { articleExtension } from '$lib/components/editor/config/article';
import { EDITOR_IS_READONLY } from '$lib/constants/constants';
import { getYAndEditor, seedState } from '$lib/y/headless';
import { readVersion } from '$lib/worker/toHTML';
import type { PageRow, StateRow } from './fakePrisma';
import { PAGE_ROWS } from './constants';
import { diffVersions, type VersionRow } from './index.server';

const stored = vi.hoisted(() => ({
	stateRows: new Map<string, StateRow>(),
	pageRows: new Map<string, PageRow>(),
	readVersion: vi.fn(),
}));

vi.mock('$lib/worker/toHTML', async () => {
	const worker = await import('../../../worker/toHTML/index.js');

	return {
		default: vi.fn(worker.toHTMLWorker),
		readVersion: stored.readVersion.mockImplementation(worker.readVersion),
		compareVersions: vi.fn(worker.compareVersions),
		renderRows: vi.fn(worker.renderRows),
	};
});

vi.mock('$lib/prisma.server', async () => ({
	default: (await import('./fakePrisma')).fakePrisma(stored),
}));
vi.mock('$lib/utils/version', () => ({ version: 'this-version' }));

/**
 * @param stays The versions whose comparison must have been stored by then.
 */
const restarted = async (...stays: VersionRow[]) => {
	await vi.waitFor(() => {
		expect(stays.every(({ id }) => stored.stateRows.has(id))).toBe(true);
		expect(stays.length === 0 || stored.pageRows.has(`${stays[0].id}:${stays[1].id}:0`)).toBe(true);
	});

	vi.resetModules();

	return import('./index.server');
};

const article = () => articleExtension(null, EDITOR_IS_READONLY, null);

const paragraph = (text: string) => $createParagraphNode().append($createTextNode(text));
const children = () => $getRoot().getChildren() as any[];

let nextId = 0;

const row = (update: Uint8Array, userId: string, at: number): VersionRow => ({
	id: `row-${nextId++}`,
	content: uint8ArrayToBase64(update),
	createdTimestamp: new Date(at),
	metadata: { userId },
});

const stateOf = (rows: VersionRow[]) =>
	Y.mergeUpdatesV2(rows.map(({ content }) => Uint8Array.from(Buffer.from(content, 'base64'))));

const seed = ($build: () => void) => [row(seedState(article(), $build), 'alice', 1000)];

const edit = async (rows: VersionRow[], userId: string, $edit: () => void) => {
	const current = stateOf(rows);
	const opened = getYAndEditor(article(), current);

	opened.editor.update($edit, { discrete: true });

	const v2Update = await opened.encodeV2();
	const update = Y.diffUpdateV2(v2Update, Y.encodeStateVectorFromUpdateV2(current));

	opened.dispose();

	return [...rows, row(update, userId, (rows.length + 1) * 1000)];
};

const marks = (html: string) => {
	const container = document.createElement('div');
	container.innerHTML = html;

	return [...container.querySelectorAll<HTMLElement>('[data-diff]')].map((element) =>
		[element.dataset.diff, element.dataset.diffBy, element.textContent].join(' ')
	);
};

const history = async () => {
	let rows = seed(() =>
		$getRoot().append(paragraph('First'), paragraph('Second'), paragraph('Kept'))
	);

	rows = await edit(rows, 'bob', () => children()[0].append($createTextNode(' by bob')));
	rows = await edit(rows, 'carol', () => {
		children()[1].remove();
		$getRoot().append(paragraph('Added by carol'));
	});

	return rows;
};

test('two versions next to each other show what the newer one changed, by its author', async () => {
	const rows = await history();

	const { changes, partial, attributed, article } = await diffVersions(rows, 0, 1);

	expect(partial).toBe(false);
	expect(attributed).toBe(true);
	expect(changes).toHaveLength(1);
	expect(marks(changes[0].columns[0])).toEqual(['change bob First']);
	expect(marks(changes[0].columns[1])).toEqual(['change bob First by bob', 'insert bob  by bob']);
	expect(article.html).toContain('First by bob');
	expect(article.html).toContain('Second');
});

test('over several versions each changed block is marked with who changed it', async () => {
	const rows = await history();

	const { changes, attributed, article } = await diffVersions(rows, 0, 2);

	expect(attributed).toBe(true);
	expect(changes.map((change) => change.columns.map(marks))).toEqual([
		[['change bob First'], ['change bob First by bob', 'insert bob  by bob']],
		[['delete carol Second', 'delete carol Second'], []],
		[[], ['insert carol Added by carol', 'insert carol Added by carol']],
	]);
	expect(article.html).toContain('Added by carol');
	expect(article.html).not.toContain('Second');
});

test('a version is only read once', async () => {
	const rows = await history();

	await diffVersions(rows, 0, 2);
	const reads = vi.mocked(readVersion).mock.calls.length;

	await diffVersions(rows, 0, 2);
	await diffVersions(rows, 1, 2);
	await diffVersions(rows, 0, 1);

	expect(vi.mocked(readVersion).mock.calls.length).toBe(reads);
});

test('an article already rendered is shown as given, without rendering the newer version', async () => {
	const rows = await history();
	const stored = { html: '<p>As stored</p>', text: 'As stored' };

	const { changes, article } = await diffVersions(rows, 0, 2, { article: stored });

	expect(article).toBe(stored);
	expect(changes).toHaveLength(3);
	expect(vi.mocked(readVersion).mock.calls.at(-1)?.[0].html).toBe(false);
});

test('either view can be asked for, and gives its own columns', async () => {
	const rows = await history();

	const split = await diffVersions(rows, 0, 1);
	const combined = await diffVersions(rows, 0, 1, { view: 'combined' });

	expect(split.view).toBe('split');
	expect(combined.view).toBe('combined');
	expect(combined.changes).toHaveLength(split.changes.length);
	expect(combined.changes.map((change) => change.columns.map(marks))).toEqual([
		[['change bob First by bob', 'insert bob  by bob']],
	]);
});

test('changed lists that are not neighbours in the article stay apart', async () => {
	const list = (text: string) =>
		$createListNode('bullet').append($createListItemNode().append($createTextNode(text)));

	let rows = seed(() => $getRoot().append(list('One'), paragraph('Kept'), list('Two')));

	rows = await edit(rows, 'bob', () => {
		for (const item of $getRoot().getAllTextNodes()) {
			if (item.getTextContent() !== 'Kept') {
				item.setTextContent(`${item.getTextContent()} more`);
			}
		}
	});

	for (const view of ['split', 'combined'] as const) {
		const { changes } = await diffVersions(rows, 0, 1, { view });

		expect(changes).toHaveLength(2);

		for (const change of changes) {
			expect(change.columns.at(-1)?.match(/<ul/g)).toHaveLength(1);
		}
	}
});

test('a version that was read before is taken from its stored state', async () => {
	const rows = await history();
	const first = await diffVersions(rows, 0, 2);

	await vi.waitFor(() => expect(rows.every(({ id }) => stored.stateRows.has(id))).toBe(true));

	stored.pageRows.clear();
	vi.mocked(readVersion).mockClear();

	const again = await (await restarted()).diffVersions(rows, 0, 2);

	expect(readVersion).not.toHaveBeenCalled();
	expect(again.changes).toEqual(first.changes);
	expect(again.article.html).toBe(first.article.html);
});

test('what another app version stored is not used, and is replaced', async () => {
	const rows = await history();
	const first = await diffVersions(rows, 0, 1);

	await vi.waitFor(() => expect(stored.stateRows.has(rows[1].id)).toBe(true));

	for (const row of [...stored.stateRows.values(), ...stored.pageRows.values()]) {
		row.madeBy = 'an-older-version';
	}

	vi.mocked(readVersion).mockClear();

	const after = await restarted();
	const again = await after.diffVersions(rows, 0, 1);

	expect(readVersion).toHaveBeenCalledTimes(2);
	expect(again.changes).toEqual(first.changes);

	await vi.waitFor(() => expect(stored.stateRows.get(rows[1].id)?.madeBy).toBe('this-version'));
	await after.diffPage(rows, 0, 1, 0);

	expect(stored.pageRows.get(`${rows[0].id}:${rows[1].id}:0`)?.madeBy).toBe('this-version');
});

test('the changed blocks come a page at a time, all of the same comparison', async () => {
	const count = PAGE_ROWS * 2 + 50;

	let rows = seed(() =>
		$getRoot().append(...Array.from({ length: count }, (_, index) => paragraph(`Block ${index}`)))
	);

	rows = await edit(rows, 'bob', () => {
		for (const text of $getRoot().getAllTextNodes()) {
			text.setTextContent(`${text.getTextContent()} edited`);
		}
	});

	const first = await diffVersions(rows, 0, 1);

	expect(first).toMatchObject({ page: 0, pages: 3, total: count });
	expect(first.changes).toHaveLength(PAGE_ROWS);

	vi.mocked(readVersion).mockClear();

	const after = await restarted(rows[0], rows[1]);
	const last = await after.diffPage(rows, 0, 1, 2);

	expect(readVersion).not.toHaveBeenCalled();
	expect(last.changes).toHaveLength(50);
	expect(marks(last.changes[0].columns[1])[0]).toContain(`Block ${PAGE_ROWS * 2}`);
	expect((await after.diffPage(rows, 0, 1, 3)).changes).toEqual([]);
});
