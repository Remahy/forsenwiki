import { blockIdState } from '@lexical/extension';
import { $getRoot, $isElementNode, $isTextNode, $parseSerializedNode } from 'lexical';

/**
 * @typedef {import('lexical').SerializedLexicalNode & { children?: SerializedNode[], $?: Record<string, unknown> }} SerializedNode
 * @typedef {{ root: { children: SerializedNode[] } }} SerializedState
 */

const MAX_COMPARISONS = 4_000_000;

/**
 * @param {SerializedNode} node
 * @returns {Record<string, unknown> | undefined}
 */
const stateWithoutBlockId = ({ $: state }) => {
	if (!state) {
		return undefined;
	}

	const rest = { ...state };
	delete rest[blockIdState.key];

	return Object.keys(rest).length ? rest : undefined;
};

/**
 * @param {unknown} value
 * @returns {unknown}
 */
const sorted = (value) => {
	if (Array.isArray(value)) {
		return value.map(sorted);
	}

	if (value !== null && typeof value === 'object') {
		const record = /** @type {Record<string, unknown>} */ (value);

		return Object.fromEntries(
			Object.keys(record)
				.sort()
				.map((key) => [key, sorted(record[key])])
		);
	}

	return value;
};

/**
 * Block ids are left out: they differ per document.
 * @param {SerializedNode} node
 * @returns {unknown}
 */
const content = (node) => ({
	...node,
	$: stateWithoutBlockId(node),
	children: node.children?.map(content),
});

/**
 * @param {SerializedNode} node
 */
export const signature = (node) => JSON.stringify(sorted(content(node)));

/**
 * @param {SerializedState} a
 * @param {SerializedState} b
 */
export const sameContent = (a, b) =>
	a.root.children.length === b.root.children.length &&
	a.root.children.every((child, index) => signature(child) === signature(b.root.children[index]));

/**
 * @param {string[]} before
 * @param {string[]} after
 * @returns {Array<[number, number]>}
 */
const matchChildren = (before, after) => {
	let start = 0;

	while (start < before.length && start < after.length && before[start] === after[start]) {
		start++;
	}

	let end = 0;

	while (
		end < before.length - start &&
		end < after.length - start &&
		before[before.length - 1 - end] === after[after.length - 1 - end]
	) {
		end++;
	}

	const rows = before.length - start - end;
	const columns = after.length - start - end;

	/** @type {Array<[number, number]>} */
	const middle = [];

	if (rows && columns && rows * columns <= MAX_COMPARISONS) {
		const width = columns + 1;
		const lengths = new Uint32Array((rows + 1) * width);

		for (let row = rows - 1; row >= 0; row--) {
			for (let column = columns - 1; column >= 0; column--) {
				lengths[row * width + column] =
					before[start + row] === after[start + column]
						? lengths[(row + 1) * width + column + 1] + 1
						: Math.max(lengths[(row + 1) * width + column], lengths[row * width + column + 1]);
			}
		}

		for (let row = 0, column = 0; row < rows && column < columns;) {
			if (before[start + row] === after[start + column]) {
				middle.push([start + row++, start + column++]);
			} else if (lengths[(row + 1) * width + column] >= lengths[row * width + column + 1]) {
				row++;
			} else {
				column++;
			}
		}
	}

	return [
		...Array.from(
			{ length: start },
			(_, index) => /** @type {[number, number]} */ ([index, index])
		),
		...middle,
		...Array.from(
			{ length: end },
			(_, index) =>
				/** @type {[number, number]} */ ([before.length - end + index, after.length - end + index])
		),
	];
};

/**
 * @param {SerializedNode} after
 * @param {SerializedNode} before
 */
const keepingBlockId = (after, before) => {
	const id = before.$?.[blockIdState.key];
	const state = {
		...stateWithoutBlockId(after),
		...(id === undefined ? {} : { [blockIdState.key]: id }),
	};

	return { ...after, $: Object.keys(state).length ? state : undefined };
};

/**
 * @param {LexicalNode} node
 * @param {SerializedNode} before
 * @param {SerializedNode} after
 */
const $patchNode = (node, before, after) => {
	if ($isElementNode(node)) {
		const { children: beforeChildren = [], ...beforeOwn } = before;
		const { children: afterChildren = [], ...afterOwn } = after;

		if (signature(beforeOwn) !== signature(afterOwn)) {
			node.updateFromJSON(/** @type {any} */ (keepingBlockId(afterOwn, beforeOwn)));
		}

		$patchChildren(node, beforeChildren, afterChildren);
	} else if ($isTextNode(node)) {
		node.updateFromJSON(/** @type {any} */ (keepingBlockId(after, before)));
	} else {
		node.replace($parseSerializedNode(after));
	}
};

/**
 * @param {import('lexical').ElementNode} parent
 * @param {SerializedNode[]} before
 * @param {SerializedNode[]} after
 */
const $patchChildren = (parent, before, after) => {
	const nodes = parent.getChildren();
	const matches = matchChildren(before.map(signature), after.map(signature));

	let from = 0;
	let to = 0;
	let index = 0;

	for (const [matchedFrom, matchedTo] of [...matches, [before.length, after.length]]) {
		while (from < matchedFrom && to < matchedTo && before[from].type === after[to].type) {
			$patchNode(nodes[from], before[from], after[to]);
			from++;
			to++;
			index++;
		}

		const inserted = after.slice(to, matchedTo).map((child) => $parseSerializedNode(child));

		if (from < matchedFrom || inserted.length) {
			parent.splice(index, matchedFrom - from, inserted);
		}

		index += inserted.length + 1;
		from = matchedFrom + 1;
		to = matchedTo + 1;
	}
};

/**
 * Changes only the nodes that differ, so the binding writes a small update that merges with
 * other edits.
 * @param {SerializedState} before
 * @param {SerializedState} after
 */
export const $patchEditorState = (before, after) => {
	$patchChildren($getRoot(), before.root.children, after.root.children);
};

/**
 * @param {SerializedState} after
 */
export const $replaceEditorState = (after) => {
	const root = $getRoot();

	root.clear();

	for (const child of after.root.children) {
		root.append($parseSerializedNode(child));
	}
};
