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
	} from 'lexical';
	import { getEditor } from 'svelte-lexical';
	import { offsetIsAtEdges } from '../utils/insertUtils';

	/** @type {import('lexical').LexicalEditor} */
	const editor = getEditor();

	/**
	 * @param {boolean} before
	 * @param {LexicalEditor} editor
	 */
	const selectionOverride = (editor, before = false) => {
		return editor.read(() => {
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
		});
	};

	onMount(() => {
		return mergeRegister(
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
