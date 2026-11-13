import * as Y from '@y/y';
import { beforeAll, expect, test, vi } from 'vitest';
import { $createParagraphNode, $createTextNode, $getEditor, $getRoot } from 'lexical';
import { $createListItemNode, $createListNode } from '@lexical/list';
import { $createHeadingNode } from '@lexical/rich-text';
import { $createTableNodeWithDimensions } from '@lexical/table';
import { uint8ArrayToBase64 } from 'uint8array-extras';

import { articleExtension } from '$lib/components/editor/config/article';
import { EDITOR_IS_READONLY } from '$lib/constants/constants';
import { blockIdOf } from '$lib/lexical/diff/helpers';
import { diffSplit } from '$lib/lexical/diff/split';
import type { SerializedNode, SerializedState } from '$lib/lexical/patchEditorState';
import { getYAndEditor, readState, seedState } from '$lib/y/headless';
import { DIFF_BUDGET, diffVersions, type VersionRow } from './index.server';

vi.mock('$lib/worker/toHTML', async () => {
	const worker = await import('../../../worker/toHTML/index.js');

	return {
		default: vi.fn(worker.toHTMLWorker),
		readVersion: vi.fn(worker.readVersion),
		renderDiff: vi.fn(worker.renderDiff),
	};
});

const BLOCKS = 1000;
const WORDS = ['version', 'article', 'paragraph', 'history', 'editor', 'change', 'block', 'text'];

const article = () => articleExtension(null, EDITOR_IS_READONLY, null);

const sentence = (seed: number, words = 40) =>
	Array.from({ length: words }, (_, index) => WORDS[(seed * 7 + index * 3) % WORDS.length]).join(
		' '
	);

const $bigArticle = (blocks = BLOCKS) => {
	const root = $getRoot();

	for (let index = 0; index < blocks; index++) {
		if (index % 25 === 0) {
			root.append($createHeadingNode('h2').append($createTextNode(`Section ${index}`)));
		} else if (index % 25 === 10) {
			root.append(
				$createListNode('bullet').append(
					...[0, 1, 2].map((item) =>
						$createListItemNode().append($createTextNode(sentence(index + item, 8)))
					)
				)
			);
		} else if (index % 100 === 50) {
			root.append($createTableNodeWithDimensions(3, 3, false));
		} else {
			const bold = $createTextNode(sentence(index, 5));
			bold.toggleFormat('bold');
			root.append($createParagraphNode().append($createTextNode(`${sentence(index)} `), bold));
		}
	}
};

const $json = () => $getEditor().getEditorState().toJSON() as unknown as SerializedState;

const timed = async <T>(run: () => T | Promise<T>) => {
	const started = performance.now();
	const result = await run();

	return { result, ms: performance.now() - started };
};

const reworded = (state: SerializedState): SerializedState => {
	const reword = (node: SerializedNode): SerializedNode => ({
		...node,
		...('text' in node ? { text: `${node.text} reworded` } : {}),
		...(node.children ? { children: node.children.map(reword) } : {}),
	});

	return { root: { ...state.root, children: state.root.children.map(reword) } };
};

const tenfold = (state: SerializedState): SerializedState => ({
	root: {
		...state.root,
		children: Array.from({ length: 10 }, (_, copy) =>
			state.root.children.map((block) => ({
				...block,
				$: { ...block.$, blockId: `${blockIdOf(block)}-${copy}` },
			}))
		).flat(),
	},
});

let nextId = 0;

const row = (update: Uint8Array, userId: string, at: number): VersionRow => ({
	id: `timing-row-${nextId++}`,
	content: uint8ArrayToBase64(update),
	createdTimestamp: new Date(at),
	metadata: { userId },
});

const edit = async (rows: VersionRow[], userId: string, $edit: () => void) => {
	const current = Y.mergeUpdatesV2(
		rows.map(({ content }) => Uint8Array.from(Buffer.from(content, 'base64')))
	);
	const opened = getYAndEditor(article(), current);

	opened.editor.update($edit, { discrete: true });

	const v2Update = await opened.encodeV2();
	const update = Y.diffUpdateV2(v2Update, Y.encodeStateVectorFromUpdateV2(current));

	opened.dispose();

	return [...rows, row(update, userId, (rows.length + 1) * 1000)];
};

let rows: VersionRow[];
let older: SerializedState;
let newer: SerializedState;

beforeAll(async () => {
	const seed = seedState(article(), () => $bigArticle());

	rows = [row(seed, 'alice', 1000)];
	rows = await edit(rows, 'bob', () => {
		const blocks = $getRoot().getChildren() as any[];
		blocks[1].getFirstChild().setTextContent('An edited paragraph near the start.');
		blocks[500].remove();
		blocks[900].insertAfter($createParagraphNode().append($createTextNode('An added paragraph.')));
	});
	rows = await edit(rows, 'carol', () => {
		const blocks = $getRoot().getChildren() as any[];
		blocks[300].getFirstChild().setTextContent('Another edited paragraph.');
	});

	older = readState(article(), Uint8Array.from(Buffer.from(rows[0].content, 'base64')), $json);
	newer = reworded(older);
}, 120_000);

const COMPARE_BUDGET = 2500;
const CACHED_BUDGET = 1000;

const report = (what: string, ms: number, budget?: number) => {
	const line = `${what}: ${Math.round(ms)} ms`;

	if (budget !== undefined && ms > budget) {
		console.warn(`OVER BUDGET (${budget} ms) ${line}`);
	} else {
		console.info(line);
	}
};

test('the article is as big as meant', () => {
	expect(older.root.children).toHaveLength(BLOCKS);
});

test('comparing a big article of which every text changed', async () => {
	const { result, ms } = await timed(() => diffSplit(older, newer));

	report('1,000 blocks, every text changed', ms, COMPARE_BUDGET);
	expect(result.rows).toHaveLength(BLOCKS);
});

test('loading a comparison of a big article, the first time and again', async () => {
	const first = await timed(() => diffVersions(rows, 0, 2));
	const again = await timed(() => diffVersions(rows, 0, 2));
	const adjacent = await timed(() => diffVersions(rows, 1, 2));

	report('1,000 blocks, comparison loaded the first time', first.ms, DIFF_BUDGET);
	report('1,000 blocks, comparison loaded again', again.ms, CACHED_BUDGET);
	report('1,000 blocks, adjacent versions loaded from the cache', adjacent.ms, CACHED_BUDGET);

	expect(first.result.changes).toHaveLength(4);
	expect(first.result.attributed).toBe(true);
	expect(again.result.changes).toEqual(first.result.changes);
	expect(adjacent.result.changes).toHaveLength(1);
});

test('comparing an article ten times as big with one block removed', async () => {
	const big = tenfold(older);
	const { result, ms } = await timed(() =>
		diffSplit(big, { root: { children: big.root.children.slice(1) } })
	);

	report('10,000 blocks, one block removed', ms);
	expect(result.rows).toHaveLength(1);
	expect(result.partial).toBe(false);
});

test('comparing an article ten times as big of which every text changed', async () => {
	const { result, ms } = await timed(() => diffSplit(tenfold(older), tenfold(newer)));

	report(`10,000 blocks, every text changed (cut short: ${result.partial})`, ms);
	expect(result.rows).toHaveLength(BLOCKS * 10);
});

test('a comparison that is cut short leaves the unchanged blocks out', async () => {
	const big = tenfold(older);
	const edited = tenfold(newer);
	const partly = {
		root: {
			...big.root,
			children: big.root.children.map((block, index) =>
				index % 4 === 0 ? edited.root.children[index] : block
			),
		},
	};

	const { result, ms } = await timed(() => diffSplit(big, partly));

	report(`10,000 blocks, every fourth changed (cut short: ${result.partial})`, ms);
	expect(result.partial).toBe(true);
	expect(result.rows).toHaveLength((BLOCKS * 10) / 4);
});

test(
	'loading a comparison of an article ten times as big, the first time and again',
	{ timeout: 120_000 },
	async () => {
		let huge = [
			row(
				seedState(article(), () => $bigArticle(BLOCKS * 10)),
				'alice',
				1000
			),
		];

		huge = await edit(huge, 'bob', () => {
			const blocks = $getRoot().getChildren() as any[];
			blocks[1].getFirstChild().setTextContent('An edited paragraph near the start.');
			blocks[5000].remove();
		});

		// New ids, so nothing is cached.
		const live = huge.map((version) => ({ ...version, id: `live-${version.id}` }));

		const first = await timed(() => diffVersions(huge, 0, 1));
		const again = await timed(() => diffVersions(huge, 0, 1));
		const stored = await timed(() => diffVersions(live, 0, 1, { article: first.result.article }));

		report('10,000 blocks, comparison loaded the first time', first.ms);
		report('10,000 blocks, comparison loaded again', again.ms);
		report('10,000 blocks, live version loaded the first time with its stored HTML', stored.ms);

		expect(first.result.changes).toHaveLength(2);
		expect(again.result.changes).toEqual(first.result.changes);
		expect(stored.result.changes).toEqual(first.result.changes);
		expect(first.result.attributed).toBe(true);

		const later = await edit(huge, 'carol', () => {
			const blocks = $getRoot().getChildren() as any[];
			blocks[2].getFirstChild().setTextContent('Another edited paragraph.');
		});
		const range = await diffVersions(later, 0, 2);

		expect(range.large).toBe(true);
		expect(range.attributed).toBe(false);
		expect(range.changes).toHaveLength(3);
	}
);

test(
	'a comparison with more changed blocks than can be rendered in time leaves the rest out',
	{ timeout: 120_000 },
	async () => {
		let huge = [
			row(
				seedState(article(), () => $bigArticle(BLOCKS * 10)),
				'alice',
				1000
			),
		];

		huge = await edit(huge, 'bob', () => {
			for (const text of $getRoot().getAllTextNodes()) {
				text.setTextContent(`${text.getTextContent()} reworded`);
			}
		});

		const first = await timed(() => diffVersions(huge, 0, 1));
		const again = await timed(() => diffVersions(huge, 0, 1));

		report('10,000 blocks, every text changed, comparison loaded the first time', first.ms);
		report('10,000 blocks, every text changed, comparison loaded again', again.ms, DIFF_BUDGET);

		for (const { result } of [first, again]) {
			expect(result.omitted).toBeGreaterThan(0);
			expect(result.changes.length + result.omitted).toBe(BLOCKS * 10);
			expect(result.changes[0].start).toEqual({ older: 1, newer: 1 });
		}
	}
);
