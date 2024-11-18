<script context="module">
	/**
	 * @typedef {Readonly<import('./VideoEmbed').VideoEmbedPayload>} InsertVideoEmbedPayload
	 */

	/** @type {import('lexical').LexicalCommand<InsertVideoEmbedPayload>} */
	export const INSERT_VIDEOEMBED_COMMAND = createCommand();
</script>

<script>
	import { onMount } from 'svelte';
	import { getEditor } from 'svelte-lexical';
	import {
		$insertNodes as insertNodes,
		createCommand,
		$createParagraphNode as createParagraphNode,
		COMMAND_PRIORITY_EDITOR,
		$getNodeByKey as getNodeByKey,
		$getSelection as getSelection,
		RootNode,
	} from 'lexical';
	import { mergeRegister } from '@lexical/utils';

	import {
		$createVideoEmbedNode as createVideoEmbedNode,
		VideoEmbedNode,
	} from './VideoEmbed';

	/** @type {import('lexical').LexicalEditor} */
	const editor = getEditor();

	/** @param {import('./VideoEmbed').VideoEmbedPayload} payload */
	function wrapperInsertVideoEmbed(payload) {
		editor.update(() => {
			const node = createVideoEmbedNode(payload);

			const selection = getSelection();
			if (!selection?.isCollapsed()) {
				return;
			}

			insertNodes([node]);

			const parent = /** @type {RootNode} */ (node.getParent());

			if (!parent) {
				node.remove();
				return;
			}
		});
	}

	onMount(() => {
		if (!editor.hasNodes([VideoEmbedNode])) {
			throw new Error('VideoEmbedPlugin: VideoEmbedNode not registered on editor');
		}

		return mergeRegister(
			editor.registerMutationListener(VideoEmbedNode, (mutatedNodes) => {
				editor.update(() => {
					for (const [key, mutation] of mutatedNodes) {
						if (mutation === 'destroyed') continue;

						/** @type {VideoEmbedNode | null} */
						const node = getNodeByKey(key);
						if (!node) {
							console.warn(
								'Could not find mutated VideoEmbedNode node by key',
								key,
								'that was',
								mutation
							);
							continue;
						}

						const prevNode = node.getPreviousSibling();
						if (!prevNode) {
							const p = createParagraphNode();
							node.insertBefore(p);
						}

						const nextNode = node.getNextSibling();
						if (!nextNode) {
							const p = createParagraphNode();
							node.insertAfter(p, false);
						}
					}
				});
			}),
			editor.registerCommand(
				INSERT_VIDEOEMBED_COMMAND,
				(payload) => {
					wrapperInsertVideoEmbed(payload);
					return true;
				},
				COMMAND_PRIORITY_EDITOR
			)
		);
	});
</script>

<slot />
