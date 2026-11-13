import { blockIdState } from '@lexical/extension';
import { diffArrays } from 'diff';
import { TEXT_TYPE_TO_FORMAT } from 'lexical';

import { DIFF_STATE_KEY } from '$lib/y/diffState';
import { signature } from './patchEditorState';

/**
 * @typedef {import('./patchEditorState').SerializedNode} SerializedNode
 * @typedef {import('./patchEditorState').SerializedState} SerializedState
 * @typedef {import('$lib/y/diffState').DiffMark} DiffMark
 * @typedef {import('$lib/y/diffState').DiffFields} DiffFields
 * @typedef {{ by?: string, at?: number }} Author
 * @typedef {{ id: number, node: SerializedNode }} Wrapper
 * @typedef {{ key: string, wrappers: Wrapper[], node: SerializedNode, text?: string }} Item
 * @typedef {{ item: Item, mark?: DiffMark, node?: SerializedNode }} Entry
 * @typedef {{ older: number, newer: number }} BlockNumbers One-based top-level block numbers.
 * @typedef {{ older: SerializedNode | null, newer: SerializedNode | null, start?: BlockNumbers }} DiffRow
 * @typedef {{ deadline: number, partial: boolean, wrappers: number }} Context
 */

export const INLINE_WRAPPERS = new Set(['link', 'a-link']);

const IGNORED_FIELDS = new Set([
	'children',
	'$',
	'type',
	'version',
	'direction',
	'textFormat',
	'textStyle',
]);

/** @type {Record<string, string[]>} */
const DERIVED_FIELDS = { listitem: ['value'] };

const DEFAULT_TIMEOUT = 1500;

const WORDS = /\s+|[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]/gu;

/**
 * @param {SerializedNode} node
 */
const isText = (node) =>
	node.type === 'text' && typeof (/** @type {any} */ (node).text) === 'string';

/**
 * @param {SerializedNode | null | undefined} node
 * @returns {string | undefined}
 */
export const blockIdOf = (node) => /** @type {string | undefined} */ (node?.$?.[blockIdState.key]);

/**
 * @param {SerializedNode} node
 * @param {DiffMark} [mark]
 * @returns {SerializedNode}
 */
const withMark = (node, mark) => {
	const state = { ...node.$ };

	delete state[blockIdState.key];

	if (mark) {
		state[DIFF_STATE_KEY] = mark;
	}

	return { ...node, $: Object.keys(state).length ? state : undefined };
};

/**
 * @param {SerializedNode} node
 * @param {DiffMark['type']} type
 * @returns {SerializedNode}
 */
const markAll = (node, type) => ({
	...withMark(node, { type }),
	...(node.children ? { children: node.children.map((child) => markAll(child, type)) } : {}),
});

/**
 * @param {DiffFields} fields
 * @param {string} name
 * @param {unknown} before
 * @param {unknown} after
 */
const addField = (fields, name, before, after) => {
	if (JSON.stringify(before) !== JSON.stringify(after)) {
		fields[name] = { __old: before, __new: after };
	}
};

/**
 * @param {DiffFields} fields
 * @param {number} before
 * @param {number} after
 */
const addFormats = (fields, before, after) => {
	for (const [name, flag] of Object.entries(TEXT_TYPE_TO_FORMAT)) {
		const was = (before & flag) !== 0;
		const is = (after & flag) !== 0;

		if (was !== is) {
			fields[name] = was ? { __old: true } : { __new: true };
		}
	}
};

/**
 * @param {SerializedNode} older
 * @param {SerializedNode} newer
 * @returns {DiffFields}
 */
const changedFields = (older, newer) => {
	/** @type {DiffFields} */
	const fields = {};
	/** @type {Record<string, unknown>} */
	const was = older;
	/** @type {Record<string, unknown>} */
	const is = newer;

	if (older.type !== newer.type) {
		fields.type = { __old: older.type, __new: newer.type };
	}

	for (const name of new Set([...Object.keys(was), ...Object.keys(is)])) {
		if (
			IGNORED_FIELDS.has(name) ||
			DERIVED_FIELDS[newer.type]?.includes(name) ||
			(name === 'text' && isText(older) && isText(newer))
		) {
			continue;
		}

		if (name === 'format' && typeof was.format === 'number' && typeof is.format === 'number') {
			addFormats(fields, was.format, is.format);
		} else {
			addField(fields, name, was[name], is[name]);
		}
	}

	return fields;
};

/**
 * @param {DiffFields} fields
 * @param {Item} older
 * @param {Item} newer
 */
const addWrapperFields = (fields, older, newer) => {
	const depth = Math.max(older.wrappers.length, newer.wrappers.length);

	for (let index = 0; index < depth; index++) {
		const was = older.wrappers[index]?.node;
		const is = newer.wrappers[index]?.node;

		if (was && is && was.type === is.type) {
			for (const [name, change] of Object.entries(changedFields(was, is))) {
				fields[`${is.type} ${name}`] = change;
			}
		} else {
			/** @param {any} node */
			const describe = (node) => node && (node.url ?? true);

			if (was) {
				fields[was.type] = { ...fields[was.type], __old: describe(was) };
			}

			if (is) {
				fields[is.type] = { ...fields[is.type], __new: describe(is) };
			}
		}
	}
};

/**
 * @param {SerializedNode[]} children
 * @param {Context} context
 * @param {boolean} flat
 * @param {Wrapper[]} [wrappers]
 * @param {Item[]} [items]
 */
const itemsOf = (children, context, flat, wrappers = [], items = []) => {
	for (const node of children) {
		if (flat && isText(node)) {
			for (const text of /** @type {string} */ (/** @type {any} */ (node).text).match(WORDS) ??
				[]) {
				items.push({ key: `w${text}`, wrappers, node, text });
			}
		} else if (flat && INLINE_WRAPPERS.has(node.type) && node.children) {
			const { children: held, ...own } = node;

			itemsOf(held, context, flat, [...wrappers, { id: context.wrappers++, node: own }], items);
		} else {
			items.push({ key: `n${signature(node)}`, wrappers, node });
		}
	}

	return items;
};

/**
 * @param {Item} older
 * @param {Item} newer
 * @param {Context} context
 * @returns {{ older: Entry, newer: Entry, changed: boolean }}
 */
const diffPair = (older, newer, context) => {
	if (performance.now() > context.deadline) {
		context.partial = true;

		return {
			older: { item: older, node: markAll(older.node, 'delete') },
			newer: { item: newer, node: markAll(newer.node, 'insert') },
			changed: true,
		};
	}

	const fields = changedFields(older.node, newer.node);
	const children =
		older.node.children && newer.node.children
			? diffChildren(older.node.children, newer.node.children, context)
			: null;
	const hasFields = Object.keys(fields).length > 0;

	const changed = hasFields || !!children?.changed;

	/** @type {DiffMark | undefined} */
	const mark = changed ? { type: 'change', ...(hasFields ? { fields } : {}) } : undefined;

	return {
		older: {
			item: older,
			node: { ...withMark(older.node, mark), ...(children ? { children: children.older } : {}) },
		},
		newer: {
			item: newer,
			node: { ...withMark(newer.node, mark), ...(children ? { children: children.newer } : {}) },
		},
		changed,
	};
};

/**
 * By block id, else the next node of the same type.
 * @param {Item[]} removed
 * @param {Item[]} added
 * @returns {Map<Item, Item>}
 */
const pairUp = (removed, added) => {
	/** @type {Map<Item, Item>} */
	const pairs = new Map();
	/** @type {Set<Item>} */
	const taken = new Set();

	const nodes = (/** @type {Item[]} */ items) => items.filter((item) => item.text === undefined);

	/** @type {Map<string, Item>} */
	const byId = new Map();

	for (const item of nodes(added)) {
		const id = blockIdOf(item.node);

		if (id !== undefined) {
			byId.set(id, item);
		}
	}

	for (const item of nodes(removed)) {
		const partner = byId.get(blockIdOf(item.node) ?? '');

		if (partner && !taken.has(partner)) {
			pairs.set(item, partner);
			taken.add(partner);
		}
	}

	const free = nodes(added).filter((item) => !taken.has(item));

	for (const item of nodes(removed)) {
		if (pairs.has(item)) {
			continue;
		}

		const index = free.findIndex((candidate) => candidate.node.type === item.node.type);

		if (index !== -1) {
			pairs.set(item, free[index]);
			free.splice(0, index + 1);
		}
	}

	return pairs;
};

/**
 * @param {Item[]} older
 * @param {Item[]} newer
 * @param {Context} context
 * @returns {{ older: Entry[], newer: Entry[], rows: Array<{ older?: Entry, newer?: Entry }>, changed: boolean }}
 */
const diffItems = (older, newer, context) => {
	const parts = diffArrays(
		older.map(({ key }) => key),
		newer.map(({ key }) => key),
		{ timeout: Math.max(1, context.deadline - performance.now()) }
	);

	if (!parts) {
		context.partial = true;
	}

	/** @type {Entry[]} */
	const olderEntries = [];
	/** @type {Entry[]} */
	const newerEntries = [];
	/** @type {Array<{ older?: Entry, newer?: Entry }>} */
	const rows = [];
	let changed = false;

	/**
	 * @param {Entry} [was]
	 * @param {Entry} [is]
	 */
	const push = (was, is) => {
		if (was) {
			olderEntries.push(was);
		}

		if (is) {
			newerEntries.push(is);
		}

		rows.push({ older: was, newer: is });
	};

	/**
	 * @param {Item} was
	 * @param {Item} is
	 */
	const pushSame = (was, is) => {
		/** @type {DiffFields} */
		const fields = {};

		if (was.text !== undefined) {
			Object.assign(fields, changedFields(was.node, is.node));
			addWrapperFields(fields, was, is);
		}

		if (Object.keys(fields).length) {
			changed = true;
			push(
				{ item: was, mark: { type: 'change', fields } },
				{ item: is, mark: { type: 'change', fields } }
			);
		} else {
			push({ item: was }, { item: is });
		}
	};

	/**
	 * @param {Item} item
	 * @param {DiffMark['type']} type
	 * @returns {Entry}
	 */
	const whole = (item, type) => ({ item, mark: { type }, node: markAll(item.node, type) });

	/**
	 * @param {Item[]} removed
	 * @param {Item[]} added
	 */
	const refine = (removed, added) => {
		const characters = (/** @type {Item[]} */ items) =>
			items.flatMap((item) =>
				[.../** @type {string} */ (item.text)].map((text) => ({ ...item, text }))
			);

		const was = characters(removed);
		const is = characters(added);
		const shortest = Math.min(was.length, is.length);

		let start = 0;

		while (start < shortest && was[start].text === is[start].text) {
			start++;
		}

		let end = 0;

		while (
			end < shortest - start &&
			was[was.length - 1 - end].text === is[is.length - 1 - end].text
		) {
			end++;
		}

		for (let index = 0; index < start; index++) {
			pushSame(was[index], is[index]);
		}

		for (const item of was.slice(start, was.length - end)) {
			changed = true;
			push(whole(item, 'delete'));
		}

		for (const item of is.slice(start, is.length - end)) {
			changed = true;
			push(undefined, whole(item, 'insert'));
		}

		for (let index = end; index > 0; index--) {
			pushSame(was[was.length - index], is[is.length - index]);
		}
	};

	/**
	 * @param {Item[]} removed
	 * @param {Item[]} added
	 */
	const resolve = (removed, added) => {
		if (
			removed.length &&
			added.length &&
			[...removed, ...added].every((item) => item.text !== undefined)
		) {
			refine(removed, added);
			return;
		}

		const pairs = pairUp(removed, added);
		const partners = new Set(pairs.values());
		let next = 0;

		const insertUntil = (/** @type {number} */ end) => {
			for (; next < end; next++) {
				if (!partners.has(added[next])) {
					changed = true;
					push(undefined, whole(added[next], 'insert'));
				}
			}
		};

		for (const item of removed) {
			const partner = pairs.get(item);

			if (!partner) {
				changed = true;
				push(whole(item, 'delete'));
				continue;
			}

			insertUntil(added.indexOf(partner));

			const pair = diffPair(item, partner, context);

			if (pair.changed) {
				changed = true;
				push(pair.older, pair.newer);
			} else {
				push({ item }, { item: partner });
			}
		}

		insertUntil(added.length);
	};

	let from = 0;
	let to = 0;
	/** @type {Item[]} */
	let removed = [];
	/** @type {Item[]} */
	let added = [];

	for (const part of parts ?? [
		{ removed: true, added: false, count: older.length },
		{ removed: false, added: true, count: newer.length },
	]) {
		if (part.removed) {
			removed = removed.concat(older.slice(from, (from += part.count)));
		} else if (part.added) {
			added = added.concat(newer.slice(to, (to += part.count)));
		} else {
			if (removed.length || added.length) {
				resolve(removed, added);
				removed = [];
				added = [];
			}

			for (let index = 0; index < part.count; index++) {
				pushSame(older[from++], newer[to++]);
			}
		}
	}

	if (removed.length || added.length) {
		resolve(removed, added);
	}

	return { older: olderEntries, newer: newerEntries, rows, changed };
};

/**
 * @param {Entry[]} entries
 * @param {number} [depth]
 * @returns {SerializedNode[]}
 */
const nodesOf = (entries, depth = 0) => {
	/** @type {SerializedNode[]} */
	const nodes = [];

	for (let index = 0; index < entries.length;) {
		const { item, mark, node } = entries[index];
		const wrapper = item.wrappers[depth];

		if (wrapper) {
			let end = index;

			while (end < entries.length && entries[end].item.wrappers[depth]?.id === wrapper.id) {
				end++;
			}

			nodes.push({ ...wrapper.node, children: nodesOf(entries.slice(index, end), depth + 1) });
			index = end;
		} else if (item.text === undefined) {
			nodes.push(node ?? item.node);
			index++;
		} else {
			const look = JSON.stringify(mark ?? null);
			let text = '';

			while (
				index < entries.length &&
				entries[index].item.node === item.node &&
				entries[index].item.wrappers.length === depth &&
				JSON.stringify(entries[index].mark ?? null) === look
			) {
				text += entries[index++].item.text;
			}

			nodes.push(/** @type {SerializedNode} */ ({ ...withMark(item.node, mark), text }));
		}
	}

	return nodes;
};

/**
 * @param {SerializedNode[]} older
 * @param {SerializedNode[]} newer
 * @param {Context} context
 */
const diffChildren = (older, newer, context) => {
	const diff = diffItems(itemsOf(older, context, true), itemsOf(newer, context, true), context);

	return { older: nodesOf(diff.older), newer: nodesOf(diff.newer), changed: diff.changed };
};

/**
 * @param {SerializedNode} node
 * @param {Author | undefined} author
 * @returns {SerializedNode}
 */
const finish = (node, author) => {
	const mark = /** @type {DiffMark | undefined} */ (node.$?.[DIFF_STATE_KEY]);

	return {
		...node,
		...(mark ? { $: { ...node.$, [DIFF_STATE_KEY]: JSON.stringify({ ...mark, ...author }) } } : {}),
		...(node.children ? { children: node.children.map((child) => finish(child, author)) } : {}),
	};
};

/**
 * @typedef {Object} DiffOptions
 * @property {number} [timeout] In milliseconds.
 * @property {(ids: { older?: string, newer?: string }) => Author | undefined} [attribute]
 */

/**
 * @param {SerializedState} older
 * @param {SerializedState} newer
 * @param {DiffOptions} [options]
 * @returns {{ rows: DiffRow[], partial: boolean }}
 */
export const diffEditorStates = (older, newer, { timeout = DEFAULT_TIMEOUT, attribute } = {}) => {
	/** @type {Context} */
	const context = { deadline: performance.now() + timeout, partial: false, wrappers: 0 };

	const diff = diffItems(
		itemsOf(older.root.children, context, false),
		itemsOf(newer.root.children, context, false),
		context
	);

	/** @type {DiffRow[]} */
	const rows = [];
	let olderBlock = 1;
	let newerBlock = 1;
	let adjacent = false;

	for (const { older: was, newer: is } of diff.rows) {
		const start = { older: olderBlock, newer: newerBlock };

		olderBlock += was ? 1 : 0;
		newerBlock += is ? 1 : 0;

		if (!was?.node && !is?.node) {
			adjacent = false;
			continue;
		}

		const author = attribute?.({
			older: blockIdOf(was?.item.node),
			newer: blockIdOf(is?.item.node),
		});

		rows.push({
			older: was?.node ? finish(was.node, author) : null,
			newer: is?.node ? finish(is.node, author) : null,
			...(adjacent ? {} : { start }),
		});

		adjacent = true;
	}

	return { rows, partial: context.partial };
};
