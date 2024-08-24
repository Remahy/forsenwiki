<script context="module" lang="ts">
	export type InsertVideoEmbedPayload = Readonly<VideoEmbedPayload>;
	export const INSERT_VIDEOEMBED_COMMAND: LexicalCommand<InsertVideoEmbedPayload> = createCommand();
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { getEditor } from 'svelte-lexical';
	import {
		$insertNodes as insertNodes,
		createCommand,
		$isRootOrShadowRoot as isRootOrShadowRoot,
		$createParagraphNode as createParagraphNode,
		COMMAND_PRIORITY_EDITOR,
		$getNodeByKey as getNodeByKey,
		type LexicalCommand,
		$getSelection as getSelection,
	} from 'lexical';
	import { $wrapNodeInElement as wrapNodeInElement, mergeRegister } from '@lexical/utils';

	import {
		$createVideoEmbedNode as createVideoEmbedNode,
		VideoEmbedNode,
		type VideoEmbedPayload,
	} from './VideoEmbed';

	const editor: LexicalEditor = getEditor();

	function wrapperInsertVideoEmbed(payload: VideoEmbedPayload) {
		editor.update(() => {
			const node = createVideoEmbedNode(payload);
			
			const selection = getSelection();
			if (!selection?.isCollapsed()) {
				return;
			}

			insertNodes([node]);

			if (isRootOrShadowRoot(node.getParentOrThrow())) {
				wrapNodeInElement(node, createParagraphNode);
			}

			const prevNode = node.getPreviousSibling();
			if (!prevNode) {
				const p = createParagraphNode();
				node.insertBefore(p);
			}

			const nextNode = node.getNextSibling();
			if (!nextNode && isRootOrShadowRoot(node.getParentOrThrow())) {
				const p = createParagraphNode();
				node.insertAfter(p, false);
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

						const node: VideoEmbedNode | null = getNodeByKey(key);
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
			editor.registerCommand<any>(
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
