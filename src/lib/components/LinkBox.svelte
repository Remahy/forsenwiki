<script>
	import Box from './Box.svelte';

	/** @type {string} */
	export let href;

	/** @type {string} */
	let className = '';

	export { className as class };
</script>

<a {href}>
	<Box
		class="border-2 border-violet-400 p-4 hover:bg-violet-300 dark:border-violet-950 dark:hover:bg-violet-950 dark:hover:bg-opacity-60 {className}"
	>
		<slot />
	</Box>
</a>
