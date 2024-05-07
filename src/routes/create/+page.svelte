<script>
	import Button from '$lib/components/Button.svelte';
	import Editor from '$lib/components/editor/editor.svelte';
	import { ChevronRightIcon, XIcon } from 'lucide-svelte';
	import { getContext, onMount } from 'svelte';

	/** @type {ComposerWritable} */
	const c = getContext('COMPOSER');
	$: composer = $c;
	$: canEdit = composer?.getEditor().isEditable();

	let disableCount = true;

	let wordsCount = 0;
	let characterCount = 0;
	let forsenCount = 0;
	// let linkCount = 0;
	// let memeCount = 0;

	/** @param {string | null | undefined} text */
	const countForsen = (text) => {
		return text?.match(/forsen/g)?.length || 0;
	};

	/** @param {string | null | undefined} text */
	const countCharacters = (text) => {
		return text?.split('').length || 0;
	};

	/** @param {string | null | undefined} text */
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
						const { textContent } = composer?.getEditor().getRootElement() || {};

						wordsCount = countWords(textContent);
						characterCount = countCharacters(textContent);
						forsenCount = countForsen(textContent);
					}
				});
			});
		});
	});
</script>

<div class="container mx-auto flex grow flex-col gap-2 p-4 lg:p-0 lg:py-12">
	<div class="mb-4 grow rounded bg-violet-200 p-4">
		<div class="prose !max-w-none">
			<p>
				Creating a new article.
				<strong>Alpha: </strong> Your article drafts are automatically saved locally.*
			</p>
			<p>
				To submit, make sure you have at least one <strong>heading 1</strong> text, and at least one
				<strong>paragraph</strong> text.
			</p>
		</div>
	</div>

	<Editor update={null} id={'new'} />

	<div class="flex border p-2">
		<div class="flex grow items-center gap-x-4 uppercase leading-none text-violet-400">
			<button class="flex items-center p-2" on:click={() => (disableCount = !disableCount)}>
				{#if !disableCount}
					<XIcon />
				{:else}
					<ChevronRightIcon />
				{/if}
			</button>

			{#if !disableCount}
				<div class="flex flex-col gap-1">
					<span><strong>Words:</strong> <span>{wordsCount}</span></span>
					<span><strong>Characters:</strong> <span>{characterCount}</span></span>
				</div>

				<div class="flex flex-col gap-1">
					<span><strong>Forsen:</strong> <span>{forsenCount}</span></span>
					<!--<span><strong>Links:</strong> <span>{linkCount}</span></span>-->
				</div>
				<!--
					<div class="flex flex-col gap-1">
						<span><strong>Memes:</strong> <span>{memeCount}</span></span>
					</div>
				-->
			{/if}
		</div>

		<Button disabled={!canEdit}>Submit</Button>
	</div>
</div>
