<script>
	import { getEditor } from 'svelte-lexical';
	import { INSERT_TABLE_COMMAND } from '@lexical/table';
	import { PlusIcon } from 'lucide-svelte';
	
	import Select from '$lib/components/Select.svelte';

	import { TRANSPARENT_IMAGE } from '../../plugins/Image/Image';
	import { INSERT_IMAGE_COMMAND } from '../../plugins/Image/ImagePlugin.svelte';
	import { INSERT_VIDEOEMBED_COMMAND } from '../../plugins/VideoEmbed/VideoEmbedPlugin.svelte';
	import { INSERT_FLOATBLOCK_COMMAND } from '../../plugins/FloatBlock/FloatBlockPlugin.svelte';

	/** @type {HTMLSelectElement | null} */
	let insertElementTypeElement = $state(null);

	let currentInsertElementType = $state('');

	let editor = $derived(getEditor());

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
			width: 1280,
			height: 720,
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
		editor.dispatchCommand(INSERT_FLOATBLOCK_COMMAND, { float: 'inline-start', width: null, height: null });
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
</script>

<div class="flex items-center gap-2 pl-2">
	<PlusIcon />

	<Select
		title="Insert new element"
		bind:value={currentInsertElementType}
		bind:ref={insertElementTypeElement}
		on:change={insertElementType}
		class="!-ml-10 !px-10"
	>
		<option value="">Insert</option>

		{#each insertElementTypeOptions as { value, label }}
			<option {value} class="text-lg">{label}</option>
		{/each}
	</Select>
</div>
