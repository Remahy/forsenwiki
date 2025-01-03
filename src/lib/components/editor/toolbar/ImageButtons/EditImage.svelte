<script>
	import { onMount } from 'svelte';
	import { $getNodeByKey as getNodeByKey } from 'lexical';
	import { getEditor } from 'svelte-lexical';
	import { RectangleHorizontalIcon, RectangleVerticalIcon } from 'lucide-svelte';
	import Button from '$lib/components/Button.svelte';
	import { modal } from '$lib/stores/modal';
	import { ImageNode } from '$lib/lexical/custom';
	import { MIN_IMAGE_HEIGHT, MIN_IMAGE_WIDTH } from '$lib/constants/image';
	import EditImageModal from './EditImageModal.svelte';

	/** @type {import("$lib/lexical/custom").ImageNode} */
	export let selectedImageNode;

	const editor = getEditor();

	let currentWidth = selectedImageNode.__width;
	let currentHeight = selectedImageNode.__height;

	const onChange = () => {
		editor.update(() => {
			selectedImageNode.setWidthAndHeight({ width: currentWidth, height: currentHeight });
		});
	};

	const image = () => {
		editor.read(() => {
			const { width: selectedImageNodeWidth, height: selectedImageNodeHeight } =
				selectedImageNode.getWidthAndHeight();

			modal.set({
				component: EditImageModal,
				src: selectedImageNode.getSrc(),
				altText: selectedImageNode.getAltText(),
				width: selectedImageNodeWidth,
				height: selectedImageNodeHeight,
				/** @param {import('../../plugins/Image/Image').ImagePayload} data */
				onSubmit: (data) => {
					editor.update(() => {
						/** @type {import('../../plugins/Image/Image').ImageNode} */
						const node = /** @type {any} */ (getNodeByKey(selectedImageNode.getKey()));

						const { width, height, altText, src } = data;

						if (
							typeof width === 'number' &&
							typeof height === 'number' &&
							height >= MIN_IMAGE_HEIGHT &&
							width >= MIN_IMAGE_WIDTH
						) {
							node.setWidthAndHeight({ width, height });
						}

						if (altText.length) {
							node.setAltText(altText);
						}

						if (src) {
							node.setSrc(src);
						}
					});
				},
				isOpen: true,
			});
		});
	};

	onMount(() => {
		const unregister = editor.registerNodeTransform(ImageNode, (node) => {
			const { width, height } = node.getWidthAndHeight();
			if (node.getKey() === selectedImageNode.getKey()) {
				currentWidth = width;
				currentHeight = height;
				selectedImageNode = node;
			}
		});

		return () => {
			unregister();
		};
	});
</script>

<Button on:click={image} class="text-xs">Change image</Button>
<label title="Width" class="flex min-h-[42px] items-center gap-2 pl-2">
	<span class="hidden">Width</span>
	<RectangleHorizontalIcon />

	<input
		class="input-color -ml-10 h-full w-28 p-0 pl-10 text-sm"
		bind:value={currentWidth}
		on:change={onChange}
		min="{MIN_IMAGE_WIDTH}"
		type="number"
	/>
</label>

<label title="Height" class="flex min-h-[42px] items-center gap-2 pl-2">
	<span class="hidden">Height</span>
	<RectangleVerticalIcon />

	<input
		class="input-color -ml-10 h-full w-28 p-0 pl-10 text-sm"
		bind:value={currentHeight}
		on:change={onChange}
		min="{MIN_IMAGE_HEIGHT}"
		type="number"
	/>
</label>

{#if currentWidth === 'inherit' && currentHeight === 'inherit'}
	<div class="self-end" title="Width and height have been set to inherit the original size.">
		<small>inherit</small>
	</div>
{/if}
