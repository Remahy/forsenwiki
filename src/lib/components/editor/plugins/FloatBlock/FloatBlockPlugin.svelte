<script context="module">
	/**
	 * @typedef {Readonly<import('./FloatBlockNode').FloatBlockNodePayload>} FloatBlockNodePayload
	 */

	/** @type {import('lexical').LexicalCommand<FloatBlockNodePayload>} */
	export const INSERT_FLOATBLOCK_COMMAND = createCommand();
</script>

<script>
	import { onMount } from 'svelte';
	import {
		createCommand,
		$createParagraphNode as createParagraphNode,
		COMMAND_PRIORITY_EDITOR,
		$isTextNode as isTextNode,
		$createTextNode as createTextNode,
	} from 'lexical';
	import { getEditor } from 'svelte-lexical';
	import { $insertNodeToNearestRoot as insertNodeToNearestRoot, mergeRegister } from '@lexical/utils';

	import { $createFloatBlockNode as createFloatBlockNode, FloatBlockNode } from './FloatBlockNode';

	/** @type {import('lexical').LexicalEditor} */
	const editor = getEditor();

	/** @param {FloatBlockNodePayload} payload */
	const wrapperInsertFloatBlock = ({ float, width, height }) => {
		editor.update(() => {
			const floatBlockNode = createFloatBlockNode({ float, width, height });

			insertNodeToNearestRoot(floatBlockNode);

			floatBlockNode.append(createParagraphNode().append(createTextNode()))

			const firstDescendant = floatBlockNode.getFirstDescendant();

			if (isTextNode(firstDescendant)) {
				firstDescendant.select();
			}
		});
	};

	onMount(() => {
		if (!editor.hasNodes([FloatBlockNode])) {
			throw new Error('FloatNodePlugin: FloatBlockNode not registered on editor');
		}

		return mergeRegister(
			editor.registerNodeTransform(FloatBlockNode, (node) => {
				const children = node.getChildren();

				if (!children.length) {
					node.remove();
				}
			}),
			editor.registerCommand(
				INSERT_FLOATBLOCK_COMMAND,
				(payload) => {
					wrapperInsertFloatBlock(payload);
					return true;
				},
				COMMAND_PRIORITY_EDITOR
			)
		);
	});
</script>
