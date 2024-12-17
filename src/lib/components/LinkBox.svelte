<script>
	import Box from './Box.svelte';

	/** @type {string} */
	export let href;

	/** @type {string} */
	let className = '';

	export { className as class };
</script>

<a {href}>
	<Box class="link-box {className}">
		<slot />
	</Box>
</a>
