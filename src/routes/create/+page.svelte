<script>
	import { getContext, onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { createArticle } from '$lib/api/articles';
	import Box from '$lib/components/Box.svelte';
	import Button from '$lib/components/Button.svelte';
	import Clown from '$lib/components/Clown.svelte';
	import Link from '$lib/components/Link.svelte';
	import Spinner from '$lib/components/Spinner.svelte';
	import Editor from '$lib/components/editor/editor.svelte';
	import { validateArticle } from '$lib/components/editor/validations';

	/** @type {Error | null} */
	let error = null;

	let title = '';

	/** @type {ComposerWritable} */
	const c = getContext('COMPOSER');
	$: composer = $c;
	$: editor = composer?.getEditor?.();
	$: canEdit = editor?.isEditable();

	$: titleError = title.length === 0 ? new Error('No title set!') : null;

	const y = getContext('YDOC');
	$: yjsDocMap = $y;

	/** @type {Writable<YDOCPERSISTENCE>} */
	const p = getContext('YDOCPERSISTENCE');
	$: persistence = $p;

	let isUploading = false;

	const submit = async () => {
		if (!yjsDocMap) return;
		if (!canEdit) return;

		const editor = composer?.getEditor();

		if (!editor) return;

		editor.update(async () => {
			isUploading = true;
			let res;

			try {
				await validateArticle(editor);

				if (!title) {
					throw new Error();
				}

				res = await createArticle(title, yjsDocMap);
			} catch (err) {
				// This throw prevents rest of code from running.
				throw err;
			} finally {
				isUploading = false;
			}

			if (res.status === 200) {
				persistence.clearData();

				const json = await res.json();
				const { title /* postUpdate: { id } */ } = json;

				goto(`/w/${title}`);
			} else if (res.status >= 400) {
				const json = await res.json();
				error = json;
			}
		});
	};

	onMount(() => {
		c.subscribe((composer) => {
			if (composer === null) {
				return;
			}

			const editor = composer.getEditor();

			editor.registerTextContentListener(() => {
				error = null;
			});
		})
	})
</script>

<div class="container mx-auto flex grow flex-col gap-2 p-4 lg:p-0 lg:py-12">
	<Box class="mb-4 p-4">
		<div class="prose !max-w-none">
			<p>
				Creating a new article.
				<strong>Alpha: </strong> Your article drafts are automatically saved locally.*
			</p>
		</div>
	</Box>

	<label>
		<strong>Title <small>(Must be unique)</small></strong>
		<input required class="w-full rounded p-2 {titleError && 'bg-red-200'}" bind:value={title} />
		{#if titleError} <strong class="text-red-500">{titleError.message}</strong> {/if}
	</label>

	<Editor update={null} id={'new'} />

	{#if error}
		<Box class="flex items-center !bg-red-200 p-2">
			<p>{error.message}</p>
		</Box>
	{/if}

	<Box class="flex items-center p-2">
		<small class="grow">
			Make sure you read the <Link href="/terms" class="hover:!text-indigo-700"
				>Terms & Conditions</Link
			>. Don't complain if your edits get deleted. <Clown />
		</small>

		<Button disabled={!canEdit || isUploading || error} on:click={submit}>
			{#if isUploading}
				<Spinner />
			{/if}

			<span>Submit</span>
		</Button>
	</Box>
</div>
