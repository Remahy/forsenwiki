<script>
	import { onMount } from 'svelte';
	import { PlusIcon } from '@lucide/svelte';
	import {
		$getSelection as getSelection,
		$isRangeSelection as isRangeSelection,
		mergeRegister,
	} from 'lexical';
	import { INSERT_TABLE_COMMAND } from '@lexical/table';
	import { getEditor } from 'svelte-lexical';

	import Select from '$lib/components/Select.svelte';
	import { blockTypeLabels } from '$lib/constants/element';
	import { $isGalleryNode as isGalleryNode } from '$lib/lexical/custom';

	import { INSERT_IMAGE_COMMAND } from '../../plugins/Image/ImagePlugin.svelte';
	import { INSERT_VIDEOEMBED_COMMAND } from '../../plugins/VideoEmbed/VideoEmbedPlugin.svelte';
	import { INSERT_FLOATBLOCK_COMMAND } from '../../plugins/FloatBlock/FloatBlockPlugin.svelte';
	import { INSERT_GALLERY_COMMAND } from '../../plugins/Gallery/GalleryPlugin.svelte';
	import { insertParagraph } from './insertParagraph';

	let isDisabled = $state(false);

	/** @type {HTMLSelectElement | null} */
	let insertElementTypeElement = $state(null);

	let currentInsertElementType = $state('');

	let editor = $derived(getEditor?.());

	/** @type {string[]} */
	let enabledInserts = $state([]);

	const insertImage = () =>
		editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
			altText: '',
			src: '',
			width: 'inherit',
			height: 'inherit',
		});

	const insertVideo = () =>
		editor.dispatchCommand(INSERT_VIDEOEMBED_COMMAND, {
			platform: 'youtube',
			src: '',
			width: 'inherit',
			height: 'inherit',
		});

	const insertTable = () =>
		editor.dispatchCommand(INSERT_TABLE_COMMAND, {
			columns: '3',
			rows: '3',
			includeHeaders: false,
		});

	const insertFloatBlock = () =>
		editor.dispatchCommand(INSERT_FLOATBLOCK_COMMAND, {
			float: 'inline-start',
			hasBorder: undefined,
			width: undefined,
			height: undefined,
		});

	const insertGallery = () => editor.dispatchCommand(INSERT_GALLERY_COMMAND, {});

	const insertElementTypeOptions = [
		{
			value: 'paragraph',
			label: blockTypeLabels.paragraph,
			insertFunc: () => insertParagraph(editor),
		},
		{
			value: 'paragraphBefore',
			label: `${blockTypeLabels.paragraph} (Before)`,
			insertFunc: () => insertParagraph(editor, 'before'),
		},
		{
			value: 'paragraphAfter',
			label: `${blockTypeLabels.paragraph} (After)`,
			insertFunc: () => insertParagraph(editor, 'after'),
		},
		{
			value: 'image',
			label: blockTypeLabels.image,
			insertFunc: insertImage,
		},
		{
			value: 'videoembed',
			label: blockTypeLabels.videoembed,
			insertFunc: insertVideo,
		},
		{
			value: 'gallery',
			label: blockTypeLabels['gallery'],
			insertFunc: insertGallery,
		},
		{
			value: 'table',
			label: blockTypeLabels['a-table'],
			insertFunc: insertTable,
		},
		{
			value: 'floatblock',
			label: blockTypeLabels['float-block'],
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
			enabledInserts = [];

			if (isRangeSelection(selection) && !selection.isCollapsed()) {
				isDisabled = true;
			} else {
				isDisabled = false;
			}

			const [nodeAtSelection] = selection?.getNodes() || [];

			if (!nodeAtSelection) {
				return;
			}

			if (isGalleryNode(nodeAtSelection)) {
				enabledInserts = ['videoembed', 'image', 'paragraphBefore', 'paragraphAfter'];
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
		class="-ml-10! min-h-10.5 px-10!"
		disabled={isDisabled}
	>
		<option value="">Insert</option>

		{#each insertElementTypeOptions as { value, label } (value)}
			<option
				{value}
				class="text-lg disabled:text-white/25"
				disabled={enabledInserts.length ? !enabledInserts.includes(value) : false}>{label}</option
			>
		{/each}
	</Select>
</div>
