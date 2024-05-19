<script>
	import { getContext } from 'svelte';
	import { $getNodeByKey as getNodeByKey } from 'lexical';
	import Button from '$lib/components/Button.svelte';
	import { modal } from '$lib/stores/modal';
	import EditImageModal from './EditImageModal.svelte';

	/** @type {import("../../plugins/Image").ImageNode} */
	export let selectedImageNode;

	/** @type {ComposerWritable} */
	const c = getContext('COMPOSER');
	$: composer = $c;
	$: editor = composer?.getEditor?.();
	$: canEdit = editor?.isEditable();

	const image = () => {
		if (!editor) return;

		modal.set({
			component: EditImageModal,
			src: selectedImageNode.getSrc(),
			altText: selectedImageNode.getAltText(),
			width: selectedImageNode.__width,
			height: selectedImageNode.__height,
			/** @param {import('../../plugins/Image').ImagePayload} data */
			onSubmit: (data) => {
				editor.update(() => {
					/** @type {import('../../plugins/Image').ImageNode} */
					const node = /** @type {any} */ (getNodeByKey(selectedImageNode.getKey()));

					if (data.height && data.width && data.height >= 28 && data.width >= 28) {
						node.setWidthAndHeight(data.width, data.height);
					}

					if (data.altText.length) {
						node.setAltText(data.altText);
					}

					if (data.src) {
						node.setSrc(data.src);
					}
				});
			},
			isOpen: true
		});
	};
</script>

<Button on:click={image} disabled={!canEdit}>Edit image</Button>
