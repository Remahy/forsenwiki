import { writable } from 'svelte/store';
import {
	$getSelection as getSelection,
	$isRangeSelection as isRangeSelection,
	$isNodeSelection as isNodeSelection,
	$isElementNode as isElementNode,
	$createNodeSelection as createNodeSelection,
	$getNodeByKey as getNodeByKey,
	$setSelection as setSelection,
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
 * @param {import("lexical").RangeSelection} selection
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
