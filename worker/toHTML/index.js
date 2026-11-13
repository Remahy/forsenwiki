import '../registerDOM.js';

import { handleJobs } from '../handleJobs.js';

import { $getEditor, $getRoot, $nodesOfType } from 'lexical';
import { $generateHtmlFromNodes } from '@lexical/html';
import { buildEditorFromExtensions } from '@lexical/extension';
import { HeadlessExtension } from '@lexical/headless';
import { createHash } from 'node:crypto';
import { base64ToUint8Array } from 'uint8array-extras';

import { readState } from '$lib/y/headless';
import { YJS13 } from '$lib/y/rows';
import { legacyUpdateToJSON } from '$lib/yjs/legacyUpdateToJSON';
import { articleExtension } from '$lib/components/editor/config/article';
import { diffExtension } from '$lib/components/editor/config/diff';
import { EDITOR_IS_READONLY } from '$lib/constants/constants';
import { ImageNode } from '$lib/lexical/custom';
import { migrations } from '$lib/components/editor/migrations';
import { blockIdOf, diffEditorStates } from '$lib/lexical/diffEditorState';
import { twitchThumbnailURL } from './twitchThumbnailURL';

const $$getTextInEditor = () => {
	return $getRoot().getTextContent().trim().replace(/\n+/gm, '\n');
};

const $$getFirstImage = () => {
	const images = $nodesOfType(ImageNode);
	const firstImage = /** @type {ImageNode | null} */ (images?.[0]);

	return firstImage?.getSrc() || '';
};

/**
 * @param {string} html
 */
const addTwitchThumbnails = async (html) => {
	if (!html.includes('data-replace-me')) {
		return html;
	}

	const replacedHTML = new DOMParser().parseFromString(
		`<html><body>${html}</body></html>`,
		'text/html'
	);
	/** @type {NodeListOf<HTMLImageElement>} */
	const twitchImages = replacedHTML.querySelectorAll('img[data-lexical-twitch][data-replace-me]');

	for (let index = 0; index < twitchImages.length; index++) {
		const image = twitchImages[index];
		const thumbnailURL = await twitchThumbnailURL({ url: image.src });

		image.src = /** @type {string} */ (thumbnailURL);
	}

	return replacedHTML.body.innerHTML;
};

/**
 * @param {string} html
 */
const topLevelBlocks = (html) => {
	const { body } = new DOMParser().parseFromString(
		`<html><body>${html}</body></html>`,
		'text/html'
	);
	const blocks = [];

	// Not `[...body.children]`: jsdom walks that live collection from its start for every index.
	for (let block = body.firstElementChild; block; block = block.nextElementSibling) {
		blocks.push(block.outerHTML);
	}

	return blocks;
};

const $$render = () => {
	const editor = $getEditor();
	const text = $$getTextInEditor().replace(/\n/g, ' ');
	const image = $$getFirstImage();
	const html = $generateHtmlFromNodes(editor, null);

	return { html, text, image };
};

/**
 * @typedef {import('$lib/lexical/patchEditorState').SerializedNode} SerializedNode
 * @typedef {import('$lib/lexical/patchEditorState').SerializedState} SerializedState
 * @typedef {import('$lib/lexical/diffEditorState').Author} Author
 */

/**
 * @param {{ update: string, html?: boolean }} data
 */
export const readVersion = async ({ update, html = false }) => {
	const read = readState(
		articleExtension(null, EDITOR_IS_READONLY, null),
		base64ToUint8Array(update),
		() => ({
			state: /** @type {SerializedState} */ (
				/** @type {unknown} */ ($getEditor().getEditorState().toJSON())
			),
			rendered: html ? $$render() : null,
		})
	);

	return {
		json: JSON.stringify(read.state),
		/** @type {Array<[id: string | null, hash: string]>} */
		blocks: read.state.root.children.map((block) => [
			blockIdOf(block) ?? null,
			createHash('sha1').update(JSON.stringify(block)).digest('base64'),
		]),
		article: read.rendered && {
			...read.rendered,
			html: await addTwitchThumbnails(read.rendered.html),
		},
	};
};

/**
 * @param {Array<SerializedNode | null>} blocks
 * @returns {Promise<string[] | null>} Null when the HTML can't be split per block.
 */
const renderDiffBlocks = async (blocks) => {
	const shown = blocks.filter((block) => block !== null);

	if (!shown.length) {
		return blocks.map(() => '');
	}

	const editor = buildEditorFromExtensions(
		HeadlessExtension,
		diffExtension(null, EDITOR_IS_READONLY, null)
	);

	editor.setEditorState(
		editor.parseEditorState(
			/** @type {any} */ ({
				root: { type: 'root', version: 1, format: '', indent: 0, direction: null, children: shown },
			})
		)
	);

	const html = editor.read(() => $generateHtmlFromNodes(editor, null));

	editor.dispose();

	const twitchThumbnailsHTML = await addTwitchThumbnails(html);
	const rendered = topLevelBlocks(twitchThumbnailsHTML);

	if (rendered.length !== shown.length) {
		return null;
	}

	return blocks.map((block) => (block === null ? '' : /** @type {string} */ (rendered.shift())));
};

const RENDER_BATCH = 100;

/**
 * @param {{ older: string, newer: string, timeout?: number, deadline: number, author?: Author, blocks?: Record<string, Author>, removed?: Record<string, Author> }} data
 * `deadline` is a `Date.now()` time: this runs on another thread, with its own `performance.now()`.
 */
export const renderDiff = async ({
	older,
	newer,
	timeout,
	deadline,
	author,
	blocks = {},
	removed = {},
}) => {
	const { rows, partial } = diffEditorStates(JSON.parse(older), JSON.parse(newer), {
		timeout,
		attribute: (ids) =>
			author ??
			(ids.newer !== undefined ? blocks[ids.newer] : undefined) ??
			(ids.older !== undefined ? (removed[ids.older] ?? blocks[ids.older]) : undefined),
	});

	/** @type {Array<{ older: string, newer: string, start?: { older: number, newer: number } }>} */
	const changes = [];

	while (changes.length < rows.length && (!changes.length || Date.now() < deadline)) {
		const batch = rows.slice(changes.length, changes.length + RENDER_BATCH);

		const [olderBlocks, newerBlocks] = await Promise.all([
			renderDiffBlocks(batch.map((row) => row.older)),
			renderDiffBlocks(batch.map((row) => row.newer)),
		]);

		if (!olderBlocks || !newerBlocks) {
			throw new Error('The compared blocks do not render as one element each.');
		}

		changes.push(
			...batch.map((row, index) => ({
				older: olderBlocks[index],
				newer: newerBlocks[index],
				start: row.start,
			}))
		);
	}

	return { changes, partial, omitted: rows.length - changes.length };
};

/**
 * @param {{ job: 'version', update: string, html?: boolean } | { job: 'diff', older: string, newer: string, timeout?: number, deadline: number } | { job?: undefined, config: string, update?: string, content?: string, format?: import('$lib/y/rows').YPostUpdateFormat }} data
 * @returns {Promise<any>}
 */
export const toHTMLWorker = async (data) => {
	if (data.job === 'version') {
		return readVersion(data);
	}

	if (data.job === 'diff') {
		return renderDiff(data);
	}

	const { config, content, update, format } = data;

	if (!config) {
		throw new Error('No config string provided.');
	}

	if (!content && !update) {
		throw new Error('No content and/or update provided.');
	}

	const cfg = articleExtension;

	const $render = $$render;

	/** @type {ReturnType<typeof $render>} */
	let rendered;
	if (update && format !== YJS13) {
		rendered = readState(cfg(null, EDITOR_IS_READONLY, null), base64ToUint8Array(update), $render);
	} else {
		const editor = buildEditorFromExtensions(
			HeadlessExtension,
			cfg(null, EDITOR_IS_READONLY, null)
		);

		const json = update
			? legacyUpdateToJSON(base64ToUint8Array(update))
			: JSON.parse(/** @type {string} */ (content));

		editor.setEditorState(editor.parseEditorState(json));

		migrations(editor);

		rendered = editor.read($render);
		editor.dispose();
	}

	const { html, text, image } = rendered;

	let replacedHTMLString = await addTwitchThumbnails(html);

	return { html: replacedHTMLString, text, image };
};

handleJobs(toHTMLWorker);
