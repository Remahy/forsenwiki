<script>
	import Divider from '$lib/components/Divider.svelte';
	import { ChevronRightIcon, XIcon } from 'lucide-svelte';
	import { getContext, onMount } from 'svelte';

	/** @type {ComposerWritable} */
	const c = getContext('COMPOSER');

	let disableCount = $state(true);

	let wordsCount = $state(0);
	let characterCount = $state(0);
	let forsenCount = $state(0);
	// let linkCount = 0;
	// let memeCount = 0;

	/** @param {string | null} [text] */
	const countForsen = (text) => {
		return text?.toLowerCase().match(/forsen/g)?.length || 0;
	};

	/** @param {string | null} [text] */
	const countCharacters = (text) => {
		return text?.replace(/[\W]+/g, '').length || 0;
	};

	/** @param {string | null} [text] */
	const countWords = (text) => {
		return text?.match(/\b\S+\b/g)?.length || 0;
	};

	onMount(() => {
		c.subscribe((composer) => {
			if (composer === null) {
				return;
			}

			const editor = composer.getEditor();

			editor.registerUpdateListener(({ editorState }) => {
				editorState.read(() => {
					if (!disableCount) {
						const { innerText } = composer?.getEditor().getRootElement() || {};

						wordsCount = countWords(innerText);
						characterCount = countCharacters(innerText);
						forsenCount = countForsen(innerText);
					}
				});
			});
		});
	});
</script>

<div class="flex grow items-center uppercase leading-none">
	<button class="flex items-center p-1" onclick={() => (disableCount = !disableCount)}>
		{#if !disableCount}
			<XIcon size="16" />
		{:else}
			<ChevronRightIcon size="16" />
		{/if}
	</button>

	{#if !disableCount}
		<div class="flex items-center gap-1">
			{#if wordsCount || characterCount || forsenCount}
				<small><strong>Words:</strong> {wordsCount}</small>
				<Divider />
				<small><strong>Characters:</strong> {characterCount}</small>
				<Divider />
				<small><strong>Forsen:</strong> {forsenCount}</small>
				<Divider />
				<!--<span><strong>Links:</strong> <span>{linkCount}</span></span>-->
			{:else}
				<small>Focus the editor to start the count.</small>
			{/if}
		</div>
		<!--
			<div class="flex flex-col gap-1">
				<span><strong>Memes:</strong> <span>{memeCount}</span></span>
			</div>
		-->
	{/if}
</div>
