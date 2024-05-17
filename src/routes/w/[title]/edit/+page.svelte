<script>
	import { getContext, onMount } from 'svelte';
	import { page } from '$app/stores';
	import Box from '$lib/components/Box.svelte';
	import Link from '$lib/components/Link.svelte';
	import Editor from '$lib/components/editor/editor.svelte';

	let id = $page.data.post.id;
	let update = $page.data.update;
	let title = $page.data.post.title;

	/** @type {Error | null} */
	let error = null;

	/** @type {{[x: string]: Error}} */
	let rawWarnings = {};

	$: warnings = Object.values(rawWarnings);

	/** @type {ComposerWritable} */
	const c = getContext('COMPOSER');

	onMount(() => {
		c.subscribe((composer) => {
			if (composer === null) {
				return;
			}

			const editor = composer.getEditor();
			editor.registerTextContentListener(() => {
				error = null;
			});
		});
	});
</script>

<div class="container mx-auto flex grow flex-col gap-2 p-4 lg:p-0 lg:py-12">
	<Box class="mb-4 p-4">
		<div class="prose !max-w-none">
			<p>
				Editing the <strong>"{title}"</strong> article.
				<strong>Alpha: </strong> Your article drafts are automatically saved locally.*
			</p>
		</div>
	</Box>

	<Editor {update} {id} />

	{#if error}
		<Box class="flex items-center !bg-red-200 p-2">
			<p>{error.message}</p>
		</Box>
	{/if}

	{#if warnings.length}
		<Box class="flex items-center !bg-yellow-200 p-2">
			{#each warnings as warning}
				<p>{warning.message}</p>
			{/each}
		</Box>
	{/if}
</div>
