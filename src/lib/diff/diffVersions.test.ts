import * as Y from '@y/y';
import { expect, test, vi } from 'vitest';
import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical';
import { uint8ArrayToBase64 } from 'uint8array-extras';

import { articleExtension } from '$lib/components/editor/config/article';
import { EDITOR_IS_READONLY } from '$lib/constants/constants';
import { getYAndEditor, seedState } from '$lib/y/headless';
import { readVersion } from '$lib/worker/toHTML';
import { diffVersions, type VersionRow } from './index.server';

vi.mock('$lib/worker/toHTML', async () => {
	const worker = await import('../../../worker/toHTML/index.js');

	return {
		default: vi.fn(worker.toHTMLWorker),
		readVersion: vi.fn(worker.readVersion),
		renderDiff: vi.fn(worker.renderDiff),
	};
});

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
	expect(marks(changes[0].older)).toEqual(['change bob First']);
	expect(marks(changes[0].newer)).toEqual(['change bob First by bob', 'insert bob  by bob']);
	expect(article.html).toContain('First by bob');
	expect(article.html).toContain('Second');
});

test('over several versions each changed block is marked with who changed it', async () => {
	const rows = await history();

	const { changes, attributed, article } = await diffVersions(rows, 0, 2);

	expect(attributed).toBe(true);
	expect(changes.map((change) => [marks(change.older), marks(change.newer)])).toEqual([
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
