import { writable } from 'svelte/store';
import {
	$getSelection as getSelection,
	$isRangeSelection as isRangeSelection,
	$isNodeSelection as isNodeSelection,
	$isElementNode as isElementNode,
	$createNodeSelection as createNodeSelection,
	$getNodeByKey as getNodeByKey,
	$setSelection as setSelection,
	$getRoot as getRoot,
	$createRangeSelection as createRangeSelection,
} from 'lexical';
import { $findMatchingParent as findMatchingParent } from '@lexical/utils';
import { $isAtNodeEnd as isAtNodeEnd } from '@lexical/selection';

import { $isDecoratorBlockNode as isDecoratorBlockNode } from '../plugins/VideoEmbed/DecoratorBlockNode';

/**
 * @typedef {import('../plugins/VideoEmbed/DecoratorBlockNode').DecoratorBlockNode} DecoratorBlockNode
 */

export function getSelectedElements() {
	const selection = getSelection();

	if (!isRangeSelection(selection) && !isNodeSelection(selection)) {
		return [];
	}

	const nodes = selection.getNodes();

	if (nodes.length === 0) {
		return [];
	}

	/**
	 * @type {Map<string, ElementNode | DecoratorBlockNode>}
	 */
	const elements = new Map();

	for (let index = 0; index < nodes.length; index++) {
		const node = nodes[index];

		const parent = /** @type {ElementNode | null} */ (
			findMatchingParent(node, (parentNode) => isElementNode(parentNode) && !parentNode.isInline())
		);

		const nodeIsElement = isDecoratorBlockNode(node) && !node.isInline();

		if (nodeIsElement) {
			elements.set(node.getKey(), node);
			continue;
		}

		if (!parent) {
			continue;
		}

		elements.set(parent.getKey(), parent);
	}

	return [...elements.values()];
}

// from svelte-lexical
/**
 * @param {import('lexical').RangeSelection} selection
 */
export function getSelectedNode(selection) {
	const anchor = selection.anchor;
	const focus = selection.focus;
	const anchorNode = selection.anchor.getNode();
	const focusNode = selection.focus.getNode();
	if (anchorNode === focusNode) {
		return anchorNode;
	}
	const isBackward = selection.isBackward();
	if (isBackward) {
		return isAtNodeEnd(focus) ? anchorNode : focusNode;
	} else {
		return isAtNodeEnd(anchor) ? focusNode : anchorNode;
	}
}

/**
 * Ported from lexical/packages/lexical-react/src/useLexicalNodeSelection.ts
 * @param {LexicalEditor} editor
 * @param {string} key
 */
export function isNodeSelected(editor, key) {
	return editor.getEditorState().read(() => {
		const node = getNodeByKey(key);

		if (node === null) {
			return false;
		}
		return node.isSelected();
	});
}
/**
 * Clear editor selection
 * @param {LexicalEditor} editor
 */
export function clearSelection(editor) {
	editor.update(() => {
		const selection = getSelection();

		if (isNodeSelection(selection)) {
			selection.clear();
		}
	});
}

/**
 * Stores `isSelected` state for a SvelteComponent node.
 * Rather than updating the component state directly, it updates the editor node selection and receives updates from the editor.
 * @param {LexicalEditor} editor
 * @param {string} nodeKey
 */
export function createNodeSelectionStore(editor, nodeKey) {
	const { subscribe, set /*, update*/ } = writable(false);

	editor.registerUpdateListener(() => {
		set(isNodeSelected(editor, nodeKey));
	});

	return {
		subscribe,
		/** @param {boolean} selected */
		set: (selected) => {
			editor.update(() => {
				let selection = getSelection();

				if (!isNodeSelection(selection)) {
					selection = createNodeSelection();
					setSelection(selection);
				}

				if (isNodeSelection(selection)) {
					if (selected) {
						selection.add(nodeKey);
					} else {
						selection.delete(nodeKey);
					}
				}
			});
		},
	};
}

/**
 * @param {LexicalEditor} editor
 * @param {number} startChar
 * @param {number} endChar
 */
export function selectByCharacterRange(editor, startChar, endChar) {
	return editor.read(() => {
		const root = getRoot();
		const textNodes = root.getAllTextNodes();

		let currentPos = 0;

		let anchorNode = null;
		let anchorOffset = 0;

		let focusNode = null;
		let focusOffset = 0;

		for (const node of textNodes) {
			const text = node.getTextContent();
			const length = text.length;

			// Find start position
			if (anchorNode === null && startChar >= currentPos && startChar <= currentPos + length) {
				anchorNode = node;
				anchorOffset = startChar - currentPos;
			}

			// Find end position
			if (focusNode === null && endChar >= currentPos && endChar <= currentPos + length) {
				focusNode = node;
				focusOffset = endChar - currentPos;
				break;
			}

			currentPos += length;
		}

		if (anchorNode && focusNode) {
			const selection = createRangeSelection();

			selection.anchor.set(anchorNode.getKey(), anchorOffset, 'text');

			selection.focus.set(focusNode.getKey(), focusOffset, 'text');

			return selection;
		}

		return null;
	});
}

/**
 * @param {BaseSelection} selection
 */
export function getGlobalOffsets(selection) {
	if (!isRangeSelection(selection)) {
		return null;
	}

	const textNodes = getRoot().getAllTextNodes();

	let pos = 0;
	let anchorOffset = -1;
	let focusOffset = -1;

	for (const node of textNodes) {
		const len = node.getTextContentSize();
		const key = node.getKey();

		if (key === selection.anchor.key) {
			anchorOffset = pos + selection.anchor.offset;
		}

		if (key === selection.focus.key) {
			focusOffset = pos + selection.focus.offset;
		}

		if (anchorOffset !== -1 && focusOffset !== -1) {
			break;
		}

		pos += len;
	}

	return {
		start: Math.min(anchorOffset, focusOffset),
		end: Math.max(anchorOffset, focusOffset),
	};
}
