<script>
	import { getContext, onMount } from 'svelte';
	import { page } from '$app/stores';
	import { HeadingNode } from '$lib/lexical';
	import Box from '$lib/components/Box.svelte';
	import Button from '$lib/components/Button.svelte';
	import Clown from '$lib/components/Clown.svelte';
	import Link from '$lib/components/Link.svelte';
	import Spinner from '$lib/components/Spinner.svelte';
	import Editor from '$lib/components/editor/editor.svelte';
	import { $nodesOfType as nodesOfType, $getNodeByKey as getNodeByKey } from 'lexical';

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
		let first = true;

		c.subscribe((composer) => {
			if (composer === null) {
				return;
			}

			const editor = composer.getEditor();
			editor.registerTextContentListener(() => {
				error = null;
			});

			editor.registerUpdateListener(({ editorState, prevEditorState }) => {
				if (first) {
					first = false;
					return;
				}

				/** @type {string} */
				let prevFirstHeadingOneNodeText;

				prevEditorState.read(() => {
					prevFirstHeadingOneNodeText = nodesOfType(HeadingNode)
						?.filter((node) => node.getTag() === 'h1')?.[0]
						.getTextContent();
				});

				editorState.read(() => {
					const newFirstHeadingOneNodeText = nodesOfType(HeadingNode)
						?.filter((node) => node.getTag() === 'h1')?.[0]
						.getTextContent();

					if (prevFirstHeadingOneNodeText !== newFirstHeadingOneNodeText) {
						rawWarnings.titleChanged = new Error('You have changed the title of this article.');
					}
				});
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
			<p>
				To submit, make sure you have at least one <strong>heading 1</strong> text, and at least one
				<strong>paragraph</strong> text.
			</p>
			<p>
				<strong
					><span class="underline decoration-2">Note:</span> If you change the first
					<span class="underline decoration-2">heading 1</span> you will also change the article's title!</strong
				>
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
