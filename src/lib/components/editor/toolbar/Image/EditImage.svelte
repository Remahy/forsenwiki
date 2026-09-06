<script>
	import { $getNodeByKey as getNodeByKey } from 'lexical';
	import { getEditor } from 'svelte-lexical';
	import { RectangleHorizontalIcon, RectangleVerticalIcon } from '@lucide/svelte';

	import Button from '$lib/components/Button.svelte';
	import { modal } from '$lib/stores/modal';
	import { IMAGE_MIN_HEIGHT, IMAGE_MIN_WIDTH } from '$lib/constants/image';
	import EditImageModal from './EditImageModal.svelte';
	import { $isGalleryNode as isGalleryNode } from '$lib/lexical/custom';

	/**
	 * @typedef {Object} Props
	 * @property {import('$lib/lexical/custom').ImageNode} selectedNode
	 */

	/** @type {Props} */
	let { selectedNode } = $props();

	let editor = $derived(getEditor?.());

	let currentWidth = $derived(selectedNode.__width);
	let currentHeight = $derived(selectedNode.__height);
	let currentAltText = $derived(selectedNode.__altText);

	let width = $derived(currentWidth === 'inherit' ? null : currentWidth);
	let height = $derived(currentHeight === 'inherit' ? null : currentHeight);
	let altText = $derived(currentAltText);

	let widthPlaceholder = $derived.by(() => {
		if (currentWidth === 'inherit' && currentHeight === 'inherit') {
			return 'Inherit';
		}

		if (currentHeight !== 'inherit' && currentWidth === 'inherit') {
			return 'Auto';
		}

		if (currentWidth === 'inherit') {
			return 'Inherit';
		}

		return '';
	});

	let heightPlaceholder = $derived.by(() => {
		if (currentWidth === 'inherit' && currentHeight === 'inherit') {
			return 'Inherit';
		}

		if (currentWidth !== 'inherit' && currentHeight === 'inherit') {
			return 'Auto';
		}

		if (currentHeight === 'inherit') {
			return 'Inherit';
		}

		return '';
	});

	let isParentGallery = $derived(editor.read(() => isGalleryNode(selectedNode.getParent())));

	const onChange = () => {
		editor.update(() => {
			selectedNode.setWidthAndHeight({ width: width || 'inherit', height: height || 'inherit' });
			selectedNode.setAltText(altText);
		});
	};

	const image = () => {
		editor.read(() => {
			const { width: selectedNodeWidth, height: selectedNodeHeight } =
				selectedNode.getWidthAndHeight();

			modal.set({
				component: EditImageModal,
				src: selectedNode.getSrc(),
				altText: selectedNode.getAltText(),
				width: selectedNodeWidth,
				height: selectedNodeHeight,
				/** @param {import('../../plugins/Image/Image').ImagePayload} data */
				onSubmit: (data) => {
					editor.update(() => {
						/** @type {import('../../plugins/Image/Image').ImageNode} */
						const node = /** @type {any} */ (getNodeByKey(selectedNode.getKey()));

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

	{#if !isParentGallery}
		<div class="flex gap-2">
			<label title="Width" class="relative flex min-h-10.5 items-center gap-2">
				<span class="hidden">Width</span>
				<RectangleHorizontalIcon class="absolute left-4" />

				<input
					class="input-color h-full w-full p-0 pl-12 text-sm"
					placeholder={widthPlaceholder}
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
					placeholder={heightPlaceholder}
					onchange={onChange}
					min={IMAGE_MIN_HEIGHT}
					type="number"
					bind:value={height}
				/>
			</label>
		</div>
	{/if}

	<label class="flex flex-col gap-2">
		<strong>Alt text</strong>
		<input class="input-color rounded-sm p-2" onchange={onChange} bind:value={altText} />
	</label>
</div>
