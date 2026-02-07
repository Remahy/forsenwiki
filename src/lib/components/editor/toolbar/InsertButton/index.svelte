<script>
	import { PlusIcon } from 'lucide-svelte';
	import { INSERT_TABLE_COMMAND } from '@lexical/table';
	import { getEditor } from 'svelte-lexical';
	import { onMount } from 'svelte';
	import { mergeRegister } from '@lexical/utils';
	import {
		$getSelection as getSelection,
		$isRangeSelection as isRangeSelection,
		$isNodeSelection as isNodeSelection,
	} from 'lexical';

	import Select from '$lib/components/Select.svelte';

	import { TRANSPARENT_IMAGE } from '../../plugins/Image/Image';
	import { INSERT_IMAGE_COMMAND } from '../../plugins/Image/ImagePlugin.svelte';
	import { INSERT_VIDEOEMBED_COMMAND } from '../../plugins/VideoEmbed/VideoEmbedPlugin.svelte';
	import { INSERT_FLOATBLOCK_COMMAND } from '../../plugins/FloatBlock/FloatBlockPlugin.svelte';

	let isDisabled = $state(false);

	/** @type {HTMLSelectElement | null} */
	let insertElementTypeElement = $state(null);

	let currentInsertElementType = $state('');

	let editor = $derived(getEditor?.());

	const insertImage = () => {
		editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
			altText: '',
			src: TRANSPARENT_IMAGE,
			width: 100,
			height: 100,
		});
	};

	const insertVideo = () => {
		editor.dispatchCommand(INSERT_VIDEOEMBED_COMMAND, {
			platform: 'youtube',
			src: '',
			width: 'inherit',
			height: 'inherit',
		});
	};

	const insertTable = () => {
		editor.dispatchCommand(INSERT_TABLE_COMMAND, {
			columns: '3',
			rows: '3',
			includeHeaders: false,
		});
	};

	const insertFloatBlock = () => {
		editor.dispatchCommand(INSERT_FLOATBLOCK_COMMAND, {
			float: 'inline-start',
			width: undefined,
			height: undefined,
		});
	};

	const insertElementTypeOptions = [
		{
			value: 'image',
			label: 'Image',
			insertFunc: insertImage,
		},
		{
			value: 'video',
			label: 'Video',
			insertFunc: insertVideo,
		},
		{
			value: 'table',
			label: 'Table',
			insertFunc: insertTable,
		},
		{
			value: 'floatblock',
			label: 'Float Block',
			insertFunc: insertFloatBlock,
		},
	];

	/** @param {Event} e */
	const insertElementType = (e) => {
		/** @type {HTMLSelectElement} */
		const target = /** @type {any} */ (e.target);
		if (target) {
			const { value } = target;

			const element = insertElementTypeOptions.find(({ value: v }) => v === value);

			if (!element) {
				if (insertElementTypeElement) {
					insertElementTypeElement.value = '';
				}

				return;
			}

			element.insertFunc();
		}

		if (insertElementTypeElement) {
			insertElementTypeElement.value = '';
		}
	};

	const updateToolbar = () => {
		editor.read(() => {
			const selection = getSelection();

			if (isNodeSelection(selection) || (isRangeSelection(selection) && !selection.isCollapsed())) {
				isDisabled = true;
			} else {
				isDisabled = false;
			}
		});
	};

	onMount(() => {
		return mergeRegister(
			editor.registerUpdateListener(() => {
				updateToolbar();
			})
		);
	});
</script>

<div class="flex items-center gap-2 pl-2">
	<PlusIcon class={isDisabled ? 'opacity-25' : ''} />

	<Select
		title="Insert new element"
		bind:value={currentInsertElementType}
		bind:ref={insertElementTypeElement}
		on:change={insertElementType}
		class="!-ml-10 min-h-10.5 !px-10"
		disabled={isDisabled}
	>
		<option value="">Insert</option>

		{#each insertElementTypeOptions as { value, label } (value)}
			<option {value} class="text-lg">{label}</option>
		{/each}
	</Select>
</div>
