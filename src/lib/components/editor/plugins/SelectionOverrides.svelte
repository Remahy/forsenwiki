<script>
	import { onMount } from 'svelte';
	import {
		$getSelection as getSelection,
		$isNodeSelection as isNodeSelection,
		$setSelection as setSelection,
		COMMAND_PRIORITY_HIGH,
		KEY_ARROW_LEFT_COMMAND,
		KEY_ARROW_RIGHT_COMMAND,
		$createNodeSelection as createNodeSelection,
		$isRangeSelection as isRangeSelection,
		$isRootOrShadowRoot as isRootOrShadowRoot,
		mergeRegister,
		$isDecoratorNode as isDecoratorNode,
		$createParagraphNode as createParagraphNode,
		$isElementNode as isElementNode,
		BEFORE_INPUT_COMMAND,
		COMMAND_PRIORITY_LOW,
	} from 'lexical';
	import { getEditor } from '$lib/components/editor/context';
	import { $isGalleryNode as isGalleryNode } from '$lib/lexical/custom';
	import { offsetIsAtEdges } from '../utils/insertUtils';

	/** @type {import('lexical').LexicalEditor} */
	const editor = getEditor();

	/**
	 * @param {boolean} before
	 * @param {LexicalEditor} editor
	 */
	const selectionOverride = (editor, before = false) => {
		const siblingFn = before ? 'getPreviousSibling' : 'getNextSibling';
		const selectionFn = before ? 'selectEnd' : 'selectStart';

		const selection = getSelection();

		if (!selection) {
			return false;
		}

		if (isNodeSelection(selection)) {
			const nodes = selection.getNodes();
			const node = nodes[0];

			if (isRootOrShadowRoot(node)) {
				// Move into the leaf inside this node.
				editor.update(() => {
					node[selectionFn]();
				});

				return false;
			} else {
				// Move to sibling.
				const sibling = node[siblingFn]();

				if (!sibling) {
					return false;
				}

				editor.update(() => {
					sibling[selectionFn]();
				});

				return false;
			}
		}

		if (!isRangeSelection(selection) || !selection.isCollapsed()) {
			return false;
		}

		const nodes = selection.getNodes();
		const node = nodes[0];

		if (!offsetIsAtEdges(before, selection.focus.offset, node.getTextContentSize())) {
			return false;
		}

		const sibling = node[siblingFn]();

		if (sibling) {
			editor.update(() => {
				const newSelection = createNodeSelection();
				newSelection.add(sibling.getKey());
				setSelection(newSelection);
			});

			return false;
		}

		const parentNode = node.getParent();
		if (!parentNode) {
			return false;
		}

		const parentSibling = parentNode[siblingFn]();
		if (!parentSibling || !isDecoratorNode(parentSibling)) {
			return false;
		}

		editor.update(() => {
			const newSelection = createNodeSelection();
			newSelection.add(parentSibling.getKey());
			setSelection(newSelection);
		});

		return false;
	};

	// Delete this this after https://github.com/meta/lexical/issues/9282 lands.
	// Lexical removes the browser's range for a node selection, so the browser would type at the
	// top of the document. Move the caret next to the node and let Lexical's handler insert the text.
	// Based on the fix for block decorators in @lexical/rich-text after 0.53.0.
	/** @param {InputEvent} event */
	const typeNextToNodeSelection = (event) => {
		const selection = getSelection();

		if (!isNodeSelection(selection) || event.inputType !== 'insertText') {
			return false;
		}

		const nodes = selection.getNodes();

		if (nodes.length !== 1) {
			event.preventDefault();
			return true;
		}

		const [node] = nodes;

		if (node.isInline()) {
			node.selectNext(0, 0);
			return false;
		}

		const parent = node.getParent();
		const block = isGalleryNode(parent) ? parent : node;
		const next = block.getNextSibling();

		if (isElementNode(next) && !next.isInline()) {
			next.selectStart();
		} else {
			const paragraph = createParagraphNode();
			block.insertAfter(paragraph);
			paragraph.select();
		}

		return false;
	};

	onMount(() => {
		return mergeRegister(
			editor.registerCommand(BEFORE_INPUT_COMMAND, typeNextToNodeSelection, COMMAND_PRIORITY_LOW),

			editor.registerCommand(
				KEY_ARROW_RIGHT_COMMAND,
				() => selectionOverride(editor, false),
				COMMAND_PRIORITY_HIGH
			),

			editor.registerCommand(
				KEY_ARROW_LEFT_COMMAND,
				() => selectionOverride(editor, true),
				COMMAND_PRIORITY_HIGH
			)
		);
	});
</script>
