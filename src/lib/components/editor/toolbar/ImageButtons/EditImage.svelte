<script>
	import { getContext, onMount } from 'svelte';
	import { $getNodeByKey as getNodeByKey } from 'lexical';
	import { RectangleHorizontalIcon, RectangleVerticalIcon } from 'lucide-svelte';
	import Button from '$lib/components/Button.svelte';
	import { modal } from '$lib/stores/modal';
	import { ImageNode } from '$lib/lexicalCustom';
	import EditImageModal from './EditImageModal.svelte';

	/** @type {import("$lib/lexicalCustom").ImageNode} */
	export let selectedImageNode;

	/** @type {ComposerWritable} */
	const c = getContext('COMPOSER');
	$: composer = $c;
	$: editor = composer?.getEditor?.();
	$: canEdit = editor?.isEditable();

	let currentWidth = selectedImageNode.__width;
	let currentHeight = selectedImageNode.__height;

	const onChange = () => {
		if (!editor) {
			return;
		}

		editor.update(() => {
			selectedImageNode.setWidthAndHeight(currentWidth, currentHeight);
		});
	};

	const image = () => {
		if (!editor) return;

		modal.set({
			component: EditImageModal,
			src: selectedImageNode.getSrc(),
			altText: selectedImageNode.getAltText(),
			width: selectedImageNode.__width,
			height: selectedImageNode.__height,
			/** @param {import('../../plugins/Image/Image').ImagePayload} data */
			onSubmit: (data) => {
				editor.update(() => {
					/** @type {import('../../plugins/Image/Image').ImageNode} */
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
			isOpen: true,
		});
	};

	onMount(() => {
		c.subscribe((composer) => {
			if (composer === null) {
				return;
			}

			const editor = composer.getEditor();

			editor.registerNodeTransform(ImageNode, (node) => {
				if (node.getKey() === selectedImageNode.getKey()) {
					currentWidth = node.__width;
					currentHeight = node.__height;
					selectedImageNode = node;
				}
			});
		});
	});
</script>

<Button on:click={image} disabled={!canEdit}>Change image</Button>
<label title="Height" class="flex h-full items-center gap-2 pl-2">
	<span class="hidden">Height</span>
	<RectangleVerticalIcon />

	<input
		class="-ml-10 h-full w-28 bg-transparent py-1 pl-10 pr-0 text-sm dark:border-violet-900"
		bind:value={currentHeight}
		on:change={onChange}
		type="number"
	/>
</label>
<label title="Width" class="flex h-full items-center gap-2 pl-2">
	<span class="hidden">Width</span>
	<RectangleHorizontalIcon />

	<input
		class="-ml-10 h-full w-28 bg-transparent py-1 pl-10 pr-0 text-sm dark:border-violet-900"
		bind:value={currentWidth}
		on:change={onChange}
		type="number"
	/>
</label>
