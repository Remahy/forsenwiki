<script>
	import { getContext, onMount } from 'svelte';
	import { $getNodeByKey as getNodeByKey } from 'lexical';
	import { RectangleHorizontalIcon, RectangleVerticalIcon } from 'lucide-svelte';
	import Button from '$lib/components/Button.svelte';
	import { modal } from '$lib/stores/modal';
	import { ImageNode } from '$lib/lexical/custom';
	import EditImageModal from './EditImageModal.svelte';

	/** @type {import("$lib/lexical/custom").ImageNode} */
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
			selectedImageNode.setWidthAndHeight({ width: currentWidth, height: currentHeight });
		});
	};

	const image = () => {
		if (!editor) {
			return;
		}

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
						height >= 28 &&
						width >= 28
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
	};

	onMount(() => {
		c.subscribe((composer) => {
			if (composer === null) {
				return;
			}

			const editor = composer.getEditor();

			editor.registerNodeTransform(ImageNode, (node) => {
				const { width, height } = node.getWidthAndHeight();
				if (node.getKey() === selectedImageNode.getKey()) {
					currentWidth = width;
					currentHeight = height;
					selectedImageNode = node;
				}
			});
		});
	});
</script>

<Button on:click={image} disabled={!canEdit} class="text-xs">Change image</Button>
<label title="Width" class="flex h-full items-center gap-2 pl-2">
	<span class="hidden">Width</span>
	<RectangleHorizontalIcon />

	<input
		class="-ml-10 h-full w-28 bg-transparent p-0 pl-10 text-sm dark:border-violet-900"
		bind:value={currentWidth}
		on:change={onChange}
		type="number"
	/>
</label>

<label title="Height" class="flex h-full items-center gap-2 pl-2">
	<span class="hidden">Height</span>
	<RectangleVerticalIcon />

	<input
		class="-ml-10 h-full w-28 bg-transparent p-0 pl-10 text-sm dark:border-violet-900"
		bind:value={currentHeight}
		on:change={onChange}
		type="number"
	/>
</label>

{#if currentWidth === 'inherit' && currentHeight === 'inherit'}
	<div class="self-end" title="Width and height have been set to inherit the original size.">
		<small>inherit</small>
	</div>
{/if}
