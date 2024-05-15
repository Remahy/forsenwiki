<script>
	import { page } from '$app/stores';
	import Box from '$lib/components/Box.svelte';
	import Editor from '$lib/components/editor/editor.svelte';

	let id = $page.data.post.id;
	let update = $page.data.update;
	let title = $page.data.post.title;
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
				<strong>Note:</strong> If you change the first <strong>heading 1</strong> you will also change the article's title!
			</p>
		</div>
	</Box>

	<Editor {update} {id} />
</div>
