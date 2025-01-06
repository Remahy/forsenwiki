<script>
	import { $getNodeByKey as getNodeByKey } from 'lexical';
	import { getEditor } from 'svelte-lexical';
	import { RectangleHorizontalIcon, RectangleVerticalIcon } from 'lucide-svelte';
	import Button from '$lib/components/Button.svelte';
	import { modal } from '$lib/stores/modal';
	import { IMAGE_MIN_HEIGHT, IMAGE_MIN_WIDTH } from '$lib/constants/image';
	import EditImageModal from './EditImageModal.svelte';

	/** @type {import("$lib/lexical/custom").ImageNode} */
	export let selectedImageNode;

	const editor = getEditor();

	$: currentWidth = selectedImageNode.__width;
	$: currentHeight = selectedImageNode.__height;

	$: width = currentWidth;
	$: height = currentHeight;

	const onChange = () => {
		editor.update(() => {
			selectedImageNode.setWidthAndHeight({ width, height });
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
							height >= IMAGE_MIN_HEIGHT &&
							width >= IMAGE_MIN_WIDTH
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
</script>

<Button on:click={image} class="text-xs">Change image</Button>

<label title="Width" class="flex min-h-[42px] items-center gap-2 pl-2">
	<span class="hidden">Width</span>
	<RectangleHorizontalIcon />

	<input
		class="input-color -ml-10 h-full w-28 p-0 pl-10 text-sm"
		placeholder={height === 'inherit' ? "Inherit" : ""}
		bind:value={width}
		on:change={onChange}
		min="{IMAGE_MIN_WIDTH}"
		type="number"
	/>
</label>

<label title="Height" class="flex min-h-[42px] items-center gap-2 pl-2">
	<span class="hidden">Height</span>
	<RectangleVerticalIcon />

	<input
		class="input-color -ml-10 h-full w-28 p-0 pl-10 text-sm"
		placeholder={height === 'inherit' ? "Inherit" : ""}
		bind:value={height}
		on:change={onChange}
		min="{IMAGE_MIN_HEIGHT}"
		type="number"
	/>
</label>
