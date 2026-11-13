<script>
	import { onDestroy } from 'svelte';

	import { openArticleDoc } from '$lib/y/openArticleDoc';
	import Spinner from '../Spinner.svelte';
	import EditorContent from './EditorContent.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {any} id
	 * @property {any} update
	 * @property {string | null} [title]
	 * @property {any} [initialUpdate]
	 */

	/** @type {Props} */
	let { id, update, title = null, initialUpdate = null } = $props();

	// The doc must be created from its stored state (yjs/yjs#824), so it loads before the editor.
	// svelte-ignore state_referenced_locally
	const opening = openArticleDoc({ id, title, update, initialUpdate });

	onDestroy(() => {
		opening.then((article) => article.destroy());
	});
</script>

{#await opening}
	<div class="editor-border box flex min-h-96 items-center justify-center gap-2">
		<Spinner />
		<span>Loading the editor...</span>
	</div>
{:then article}
	<EditorContent {id} {article} />
{:catch error}
	<div class="editor-border bg-red-300! p-2 font-bold dark:text-black" role="alert">
		The editor could not load this article's local draft ({error?.message ?? error}). Reload the
		page, or reset the draft cache below.
	</div>
{/await}
