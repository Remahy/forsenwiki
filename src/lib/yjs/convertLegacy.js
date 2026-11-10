import { $getEditor } from 'lexical';
import { buildEditorFromExtensions } from '@lexical/extension';
import { HeadlessExtension } from '@lexical/headless';

import { articleExtension } from '$lib/components/editor/config/article';
import { EDITOR_IS_READONLY } from '$lib/constants/constants';
import { readState, seedFromJSON } from '$lib/y/headless';

import { legacyUpdateToJSON } from './legacyUpdateToJSON';

/**
 * @typedef {Record<string, unknown> & { type?: string, children?: SerializedNode[] }} SerializedNode
 */

const config = () => articleExtension(null, EDITOR_IS_READONLY, null);

// Block ids are new, and a direction is derived from the text again.
const IGNORED_FIELDS = new Set(['$', 'direction', 'children']);

/**
 * Values the two editors store differently without meaning something else: nothing as `null`,
 * `undefined` or `''`, a number as a string, no column width as `''` or `0`.
 * @param {string} key
 * @param {unknown} value
 * @returns {unknown}
 */
const comparable = (key, value) => {
	if (Array.isArray(value)) {
		return value.map((item) => comparable(key, item));
	}

	if (value === null || value === undefined || value === '') {
		return null;
	}

	if (key === 'colWidths' && !value) {
		return null;
	}

	if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
		return Number(value);
	}

	if (typeof value === 'object') {
		const record = /** @type {Record<string, unknown>} */ (value);

		return Object.fromEntries(
			Object.keys(record)
				.sort()
				.map((name) => [name, comparable(name, record[name])])
		);
	}

	return value;
};

/**
 * @param {SerializedNode} before
 * @param {SerializedNode} after
 * @param {string} path
 * @param {string[]} differences
 */
const compare = (before, after, path, differences) => {
	const at = `${path}/${before.type}`;

	for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
		if (IGNORED_FIELDS.has(key)) {
			continue;
		}

		const was = JSON.stringify(comparable(key, before[key]));
		const is = JSON.stringify(comparable(key, after[key]));

		if (was !== is) {
			differences.push(`${at}.${key}: ${was} -> ${is}`);
		}
	}

	const beforeChildren = before.children ?? [];
	const afterChildren = after.children ?? [];

	if (beforeChildren.length !== afterChildren.length) {
		differences.push(`${at}: ${beforeChildren.length} -> ${afterChildren.length} children`);
		return;
	}

	beforeChildren.forEach((child, index) =>
		compare(child, afterChildren[index], `${at}[${index}]`, differences)
	);
};

/**
 * Where a converted article says something else than the article it was converted from.
 * @param {{ root: SerializedNode }} before
 * @param {{ root: SerializedNode }} after
 */
export const conversionDifferences = (before, after) => {
	/** @type {string[]} */
	const differences = [];

	compare(before.root, after.root, '', differences);

	return differences;
};

/**
 * Seeds a `@lexical/y` document from an article stored by the Yjs 13 editor, and compares what
 * the two read as.
 * @param {Uint8Array} updateV2 The article's merged Yjs 13 updates.
 * @returns {{ update: Uint8Array, differences: string[] }}
 */
export const convertLegacyArticle = (updateV2) => {
	const json = legacyUpdateToJSON(updateV2);

	// Parsed by the same nodes as the converted article, so deprecated node types compare equal.
	const legacy = buildEditorFromExtensions(HeadlessExtension, config());
	legacy.setEditorState(legacy.parseEditorState(json));
	const before = legacy.getEditorState().toJSON();
	legacy.dispose();

	const update = seedFromJSON(config(), json);
	const after = readState(config(), update, () => $getEditor().getEditorState().toJSON());

	return {
		update,
		differences: conversionDifferences(/** @type {any} */ (before), /** @type {any} */ (after)),
	};
};
