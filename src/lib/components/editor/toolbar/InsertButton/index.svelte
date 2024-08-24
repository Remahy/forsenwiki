<script>
	import { getContext, onMount } from 'svelte';
	import { PlusIcon } from 'lucide-svelte';
	import {
		$createParagraphNode as createParagraphNode,
		$insertNodes as insertNodes,
		$isRootOrShadowRoot as isRootOrShadowRoot,
		COMMAND_PRIORITY_EDITOR,
	} from 'lexical';
	import { $wrapNodeInElement as wrapNodeInElement } from '@lexical/utils';

	import Select from '$lib/components/Select.svelte';
	import {
		TRANSPARENT_IMAGE,
		$createImageNode as createImageNode,
	} from '../../plugins/Image/Image';
	import { INSERT_IMAGE_COMMAND } from '../../plugins/Image/ImagePlugin.svelte';
	import { INSERT_VIDEOEMBED_COMMAND } from '../../plugins/VideoEmbed/VideoEmbedPlugin.svelte';

	/** @type {HTMLSelectElement} */
	let insertElementTypeElement;

	let currentInsertElementType = '';

	/** @type {ComposerWritable} */
	const c = getContext('COMPOSER');
	$: composer = $c;
	$: canEdit = composer?.getEditor().isEditable();
	$: editor = composer?.getEditor();

	const insertImage = () => {
		if (!editor) return;

		editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
			altText: '',
			src: TRANSPARENT_IMAGE,
			width: 100,
			height: 100,
		});
	};

	const insertVideo = () => {
		if (!editor) return;

		editor.dispatchCommand(INSERT_VIDEOEMBED_COMMAND, {
			platform: 'youtube',
			src: '',
			width: 1280,
			height: 720,
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
	];

	/** @param {Event} e */
	const insertElementType = (e) => {
		if (!editor) return;

		/** @type {HTMLSelectElement} */
		const target = /** @type {any} */ (e.target);
		if (target) {
			const { value } = target;

			const element = insertElementTypeOptions.find(({ value: v }) => v === value);

			if (!element) {
				insertElementTypeElement.value = '';
				return;
			}

			element.insertFunc();
		}

		insertElementTypeElement.value = '';
	};
</script>

<div class="flex items-center gap-2 pl-2">
	<PlusIcon />

	<Select
		title="Insert new element"
		disabled={!canEdit}
		bind:value={currentInsertElementType}
		bind:ref={insertElementTypeElement}
		on:change={insertElementType}
		class="-ml-10 px-10"
	>
		<option value="">Insert</option>

		{#each insertElementTypeOptions as { value, label }}
			<option {value} class="text-lg">{label}</option>
		{/each}
	</Select>
</div>
