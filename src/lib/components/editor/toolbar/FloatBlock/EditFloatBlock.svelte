<script>
	import {
		ArrowLeftToLineIcon,
		ArrowRightToLineIcon,
		BrickWallIcon,
		ChevronsLeftRightEllipsisIcon,
		FileQuestionMarkIcon,
		RectangleHorizontalIcon,
		RectangleVerticalIcon,
		SquareDashedIcon,
	} from '@lucide/svelte';
	import { getEditor } from 'svelte-lexical';
	import Select from '$lib/components/Select.svelte';
	import EditorButton from '../EditorButton.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {import('$lib/lexical/custom').FloatBlockNode} selectedFloatBlockNode
	 */

	/** @type {Props & { [key: string]: any }} */
	let { selectedFloatBlockNode } = $props();

	let currentWidth = $derived(selectedFloatBlockNode.__width);
	let currentHeight = $derived(selectedFloatBlockNode.__height);
	let currentFloatValue = $derived(selectedFloatBlockNode.__float);
	let currentHasBorder = $derived(selectedFloatBlockNode.__hasBorder);

	let width = $derived(currentWidth);
	let height = $derived(currentHeight);
	let floatValue = $derived(currentFloatValue === null ? 'none' : currentFloatValue);
	/** @type {HTMLSelectElement | null} */
	let floatValueElement = $state(null);

	let placeholderWidthText = $derived.by(() => {
		let placeholderText = 'Auto';

		if (floatValue === 'none') {
			return 'Fill';
		}

		if (floatValue === 'clear') {
			return 'Ignored';
		}

		return placeholderText;
	});

	let placeholderHeightText = $derived.by(() => {
		let placeholderText = 'Auto';

		if (floatValue === 'clear') {
			return 'Ignored';
		}

		return placeholderText;
	});

	/**
	 * @type {{ [x: string]: import('svelte').Component<any> }}
	 */
	const floatValueIcons = {
		left: ArrowLeftToLineIcon,
		right: ArrowRightToLineIcon,
		'inline-start': ArrowLeftToLineIcon,
		'inline-end': ArrowRightToLineIcon,
		clear: ChevronsLeftRightEllipsisIcon,
		none: BrickWallIcon,
		default: FileQuestionMarkIcon,
	};

	const FloatIconComponent = $derived(
		floatValueIcons[floatValue || 'none'] || floatValueIcons.default
	);

	const editor = getEditor();

	const onChange = () => {
		editor.update(() => {
			selectedFloatBlockNode.setWidth(width || undefined);
			selectedFloatBlockNode.setHeight(height || undefined);
		});
	};

	/**
	 * @param {Event} e
	 */
	const float = (e) => {
		const { value } = /** @type {HTMLSelectElement} */ (e.currentTarget);

		editor.update(() => {
			// @ts-ignore
			selectedFloatBlockNode.setFloat(value);
		});
	};

	const toggleHasBorder = () => {
		editor.update(() => {
			selectedFloatBlockNode.setHasBorder(!currentHasBorder);
		});
	};
</script>

<div class="flex flex-col gap-4">
	<div class="relative flex w-full items-center gap-2">
		<FloatIconComponent class="absolute left-4" />

		<Select
			title="Float"
			bind:ref={floatValueElement}
			on:change={float}
			bind:value={floatValue}
			class="h-full min-h-10.5 w-[stretch] px-12! "
		>
			<option value="unknown" hidden>Unknown</option>

			<option value="left" class="text-lg">Left</option>
			<option value="right" class="text-lg">Right</option>
			<option value="inline-start" class="text-lg">Start (Language aware)</option>
			<option value="inline-end" class="text-lg">End (Language aware)</option>
			<option value="clear" class="text-lg">Clear float</option>
			<option value="none" class="text-lg">Block (Non-floating)</option>
		</Select>
	</div>

	<div class="flex gap-2">
		<label title="Width" class="relative flex min-h-10.5 items-center gap-2">
			<span class="hidden">Width</span>
			<RectangleHorizontalIcon class="absolute left-4" />

			<input
				class="input-color h-full w-full p-0 pl-12 text-sm disabled:opacity-50 disabled:hover:cursor-not-allowed"
				placeholder={placeholderWidthText}
				bind:value={width}
				onchange={onChange}
				disabled={floatValue === 'clear'}
			/>
		</label>

		<label title="Height" class="relative flex min-h-10.5 items-center gap-2">
			<span class="hidden">Height</span>
			<RectangleVerticalIcon class="absolute left-4" />

			<input
				class="input-color h-full w-full p-0 pl-12 text-sm disabled:opacity-50 disabled:hover:cursor-not-allowed"
				placeholder={placeholderHeightText}
				bind:value={height}
				onchange={onChange}
				disabled={floatValue === 'clear'}
			/>
		</label>
	</div>

	<div
		class="forsen-wiki-theme-border flex items-center rounded-sm border bg-violet-900/25 text-sm text-white"
	>
		<EditorButton on:click={toggleHasBorder} isActive={!!currentHasBorder} title="Toggle border">
			<SquareDashedIcon />
		</EditorButton>

		<div class="flex grow items-center gap-2 p-2" title="Toggle header">
			<span>Toggle border</span>
		</div>
	</div>
</div>
