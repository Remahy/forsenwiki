<script>
	import Editor from "$lib/components/editor/editor.svelte";
</script>

<div class="flex grow flex-col gap-2 p-4">
	<div class="prose !max-w-none">
		<p>Creating a new article. <strong>Alpha: </strong> Your article drafts are automatically saved locally.*</p>
		<p>
			To submit, make sure you have at least one <strong>heading 1</strong> text, and at least one
			<strong>paragraph</strong> text.
		</p>
	</div>

	<hr class="h-0.5 rounded border-0 bg-fuchsia-900" />

	<Editor update={null} id={'new'} />
</div>
