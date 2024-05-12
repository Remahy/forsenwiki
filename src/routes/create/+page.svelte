<script>
	import { getContext } from 'svelte';

	import { createArticle } from '$lib/api/articles';
	import Box from '$lib/components/Box.svelte';
	import Button from '$lib/components/Button.svelte';
	import Clown from '$lib/components/Clown.svelte';
	import Link from '$lib/components/Link.svelte';
	import Spinner from '$lib/components/Spinner.svelte';
	import Editor from '$lib/components/editor/editor.svelte';
	import { validateArticle } from '$lib/components/editor/validations';

	/** @type {ComposerWritable} */
	const c = getContext('COMPOSER');
	$: composer = $c;
	$: canEdit = composer?.getEditor().isEditable();

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
				res = await createArticle(yjsDocMap);
			} catch (error) {
				return;
			} finally {
				isUploading = false;
			}

			if (res.status === 200) {
				const json = await res.json();
				console.log('Yay', JSON.stringify(json));
				persistence.clearData()
      	window.location.reload()
			}
		});
	};
</script>

<div class="container mx-auto flex grow flex-col gap-2 p-4 lg:p-0 lg:py-12">
	<Box class="mb-4 p-4">
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
	</Box>

	<Editor update={null} id={'new'} />

	<Box class="flex items-center p-2">
		<small class="grow">
			Make sure you read the <Link href="/terms" class="hover:!text-indigo-700"
				>Terms & Conditions</Link
			>. Don't complain if your edits get deleted. <Clown />
		</small>

		<Button disabled={!canEdit || isUploading} on:click={submit}>
			{#if isUploading}
				<Spinner />
			{/if}

			<span>Submit</span>
		</Button>
	</Box>
</div>
