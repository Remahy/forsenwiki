<script module>
	/**
	 * @typedef {Readonly<import('./Gallery').GalleryNodePayload>} GalleryNodePayload
	 */

	/** @type {import('lexical').LexicalCommand<GalleryNodePayload>} */
	export const INSERT_GALLERY_COMMAND = createCommand();
</script>

<script>
	import { onMount } from 'svelte';
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

	const editor = getEditor();

	const allowedChildren = [isImageNode, isVideoEmbedNode];

	/** @param {GalleryNodePayload} payload */
	const wrapperInsertFloatBlock = ({ float, width, height, hasBorder }) => {
		editor.update(() => {
			const floatBlockNode = createGalleryNode({ float, width, height, hasBorder });

			insertNodeToNearestRoot(floatBlockNode);
		});
	};

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
			)
		);

		return () => {
			unregister();
		};
	});
</script>
