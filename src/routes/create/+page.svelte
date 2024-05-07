<script>
	import Box from '$lib/components/Box.svelte';
	import Button from '$lib/components/Button.svelte';
	import Clown from '$lib/components/Clown.svelte';
	import Link from '$lib/components/Link.svelte';
	import Editor from '$lib/components/editor/editor.svelte';
	import { getContext } from 'svelte';

	/** @type {ComposerWritable} */
	const c = getContext('COMPOSER');
	$: composer = $c;
	$: canEdit = composer?.getEditor().isEditable();
</script>

<div class="container mx-auto flex grow flex-col gap-2 p-4 lg:p-0 lg:py-12">
	<Box class="mb-4 grow p-4">
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
		<div class="grow">
			Make sure you read the <Link href="/terms" class="hover:!text-indigo-700"
				>Terms & Conditions</Link
			>. Don't complain if your edits get deleted. <Clown />
		</div>
		<Button disabled={!canEdit}>Submit</Button>
	</Box>
</div>
