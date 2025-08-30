<script module>
	/**
	 * @typedef {Readonly<import('./VideoEmbed').VideoEmbedPayload>} InsertVideoEmbedPayload
	 */

	/** @type {import('lexical').LexicalCommand<InsertVideoEmbedPayload>} */
	export const INSERT_VIDEOEMBED_COMMAND = createCommand();
</script>

<script>
	// Based on umaranis' svelte-lexical

	import {
		$insertNodes as insertNodes,
		createCommand,
		$createParagraphNode as createParagraphNode,
		COMMAND_PRIORITY_EDITOR,
		$getNodeByKey as getNodeByKey,
		$getSelection as getSelection,
		RootNode,
	} from 'lexical';
	import { getEditor } from 'svelte-lexical';
	import { mergeRegister } from '@lexical/utils';

	import { getYouTubeClipURL } from '$lib/api/utils';
	import { $createVideoEmbedNode as createVideoEmbedNode, VideoEmbedNode } from './VideoEmbed';

	/**
	 * @typedef {Object} Props
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props} */
	let { children } = $props();

	/** @type {import('lexical').LexicalEditor} */
	const editor = getEditor();

	/**
	 * @param {LexicalEditor} editor
	 * @param {VideoEmbedNode} node
	 */
	const fixYouTubeClipURL = async (editor, node) => {
		const url = /** @type {string} */ (node.getSrc());

		let res;

		try {
			const req = await getYouTubeClipURL(url);

			if (req.status === 200) {
				res = await req.json();
			}
		} catch {
			// noop
		}

		if (res === url) {
			return;
		}

		if (typeof res === 'string') {
			editor.update(() => {
				node.setSrc(res);
			});
		}
	};

	/** @param {import('./VideoEmbed').VideoEmbedPayload} payload */
	const wrapperInsertVideoEmbed = (payload) => {
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
	};

	$effect(() => {
		if (!editor.hasNodes([VideoEmbedNode])) {
			throw new Error('VideoEmbedPlugin: VideoEmbedNode not registered on editor');
		}

		return mergeRegister(
			editor.registerMutationListener(VideoEmbedNode, (mutatedNodes) => {
				editor.update(() => {
					for (const [key, mutation] of mutatedNodes) {
						if (mutation === 'destroyed') {
							continue;
						}

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

						if (node.getPlatform() === 'youtube' && node.getSrc()?.includes('youtube.com/clip/')) {
							fixYouTubeClipURL(editor, node);
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

{@render children?.()}
