<script module>
	/**
	 * @typedef {Readonly<import('./Gallery').GalleryNodePayload>} GalleryNodePayload
	 */

	/** @type {import('lexical').LexicalCommand<GalleryNodePayload>} */
	export const INSERT_GALLERY_COMMAND = createCommand();
</script>

<script>
	import { onMount } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import { COMMAND_PRIORITY_EDITOR, createCommand } from 'lexical';
	import { getEditor } from 'svelte-lexical';
	import {
		$insertNodeToNearestRoot as insertNodeToNearestRoot,
		mergeRegister,
		$unwrapAndFilterDescendants as unwrapAndFilterDescendants,
	} from '@lexical/utils';
	import { $isVideoEmbedNode as isVideoEmbedNode } from '../VideoEmbed/VideoEmbed';
	import { $isImageNode as isImageNode } from '../Image/Image';
	import { $createGalleryNode as createGalleryNode, GalleryNode } from './Gallery';
	import { initializeEmblaForEditorElement } from './embla';

	import './EditorGallery.css';

	const editor = getEditor();

	const allowedChildren = [isImageNode, isVideoEmbedNode];

	/** @param {GalleryNodePayload} payload */
	const wrapperInsertFloatBlock = ({ float, width, height, hasBorder }) => {
		editor.update(() => {
			const floatBlockNode = createGalleryNode({ float, width, height, hasBorder });

			insertNodeToNearestRoot(floatBlockNode);
		});
	};

	/**
	 * @type {Map<string, ReturnType<import('./embla').Embla>>}
	 */
	const instances = new SvelteMap();

	onMount(() => {
		if (!editor.hasNodes([GalleryNode])) {
			throw new Error('GalleryPlugin: GalleryNode not registered on editor');
		}

		const unregister = mergeRegister(
			editor.registerNodeTransform(GalleryNode, (node) => {
				unwrapAndFilterDescendants(node, (n) => !!allowedChildren.find((fn) => fn(n)));
			}),
			editor.registerCommand(
				INSERT_GALLERY_COMMAND,
				(payload) => {
					wrapperInsertFloatBlock(payload);
					return true;
				},
				COMMAND_PRIORITY_EDITOR
			),
			editor.registerMutationListener(GalleryNode, (mutations) => {
				for (const [nodeKey, mutation] of mutations) {
					if (mutation === 'destroyed') {
						instances.get(nodeKey)?.destroy();
						instances.delete(nodeKey);
						continue;
					}

					if (mutation === 'created') {
						const element = editor.getElementByKey(nodeKey);

						if (!element) {
							continue;
						}

						const embla = initializeEmblaForEditorElement(element);

						instances.set(nodeKey, embla);
					}
				}
			}),
			editor.registerUpdateListener(() => {
				for (const [nodeKey, embla] of instances) {
					const element = editor.getElementByKey(nodeKey);

					if (!element) {
						continue;
					}

					embla.reInit();
				}
			})
		);

		return () => {
			unregister();

			for (const embla of instances.values()) {
				embla.destroy();
			}

			instances.clear();
		};
	});
</script>
