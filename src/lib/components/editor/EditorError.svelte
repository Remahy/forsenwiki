<script>
	import Box from '$lib/components/Box.svelte';
	import ShowBlocksButton from './ShowBlocksButton.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {EditorErrorValue} error
	 * @property {LexicalEditor} [editor] Shows the blocks the error is about.
	 */

	/** @type {Props} */
	const { error, editor } = $props();
</script>

<Box class="flex items-center gap-4 bg-red-300! p-2 font-bold dark:text-black">
	<p class="grow">
		{#if error.status || error.statusText}
			({error.status} {error.statusText})
		{/if}
		{error.message}
	</p>
	{#if error.blockIds?.length && editor}
		<ShowBlocksButton {editor} blockIds={error.blockIds} label="image" />
	{/if}
</Box>
