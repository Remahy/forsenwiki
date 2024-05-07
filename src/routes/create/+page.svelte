<script>
	import Button from '$lib/components/Button.svelte';
	import Editor from '$lib/components/editor/editor.svelte';
	import { getContext } from 'svelte';

	/** @type {ComposerWritable} */
	const c = getContext('COMPOSER');
	$: composer = $c;
	$: canEdit = composer?.getEditor().isEditable();
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
		<div class="grow" />
		<Button disabled={!canEdit}>Submit</Button>
	</div>
</div>
