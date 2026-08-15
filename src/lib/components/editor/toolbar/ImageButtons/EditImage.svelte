<script>
	import { $getNodeByKey as getNodeByKey } from 'lexical';
	import { getEditor } from 'svelte-lexical';
	import { RectangleHorizontalIcon, RectangleVerticalIcon } from '@lucide/svelte';

	import Button from '$lib/components/Button.svelte';
	import { modal } from '$lib/stores/modal';
	import { IMAGE_MIN_HEIGHT, IMAGE_MIN_WIDTH } from '$lib/constants/image';
	import EditImageModal from './EditImageModal.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {import('$lib/lexical/custom').ImageNode} selectedImageNode
	 */

	/** @type {Props} */
	let { selectedImageNode } = $props();

	let editor = $derived(getEditor?.());

	let currentWidth = $derived(selectedImageNode.__width);
	let currentHeight = $derived(selectedImageNode.__height);
	let currentAltText = $derived(selectedImageNode.__altText);

	let width = $derived(currentWidth);
	let height = $derived(currentHeight);
	let altText = $derived(currentAltText);

	const onChange = () => {
		editor.update(() => {
			selectedImageNode.setWidthAndHeight({ width, height });
			selectedImageNode.setAltText(altText);
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

						const { width, height, src } = data;

						if (typeof width === 'number' && width >= IMAGE_MIN_WIDTH) {
							node.setWidthAndHeight({ width, height: node.getWidthAndHeight().height });
						}

						if (typeof height === 'number' && height >= IMAGE_MIN_HEIGHT) {
							node.setWidthAndHeight({ width: node.getWidthAndHeight().width, height });
						}

						node.setSrc(src);
					});
				},
				isOpen: true,
			});
		});
	};
</script>

<div class="flex flex-col gap-4">
	<Button on:click={image} class="text-xs">Change image</Button>

	<div class="flex gap-2">
		<label title="Width" class="relative flex min-h-10.5 items-center gap-2">
			<span class="hidden">Width</span>
			<RectangleHorizontalIcon class="absolute left-4" />

			<input
				class="input-color h-full w-full p-0 pl-12 text-sm"
				placeholder={height === 'inherit' ? 'Inherit' : ''}
				onchange={onChange}
				min={IMAGE_MIN_WIDTH}
				type="number"
				bind:value={width}
			/>
		</label>

		<label title="Height" class="relative flex min-h-10.5 items-center gap-2">
			<span class="hidden">Height</span>
			<RectangleVerticalIcon class="absolute left-4" />

			<input
				class="input-color h-full w-full p-0 pl-12 text-sm"
				placeholder={height === 'inherit' ? 'Inherit' : ''}
				onchange={onChange}
				min={IMAGE_MIN_HEIGHT}
				type="number"
				bind:value={height}
			/>
		</label>
	</div>

	<label class="flex flex-col gap-2">
		<strong>Alt text</strong>
		<input class="input-color rounded-sm p-2" onchange={onChange} bind:value={altText} />
	</label>
</div>
