<script>
	import Box from './Box.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {string} href
	 * @property {string} [class]
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props} */
	let { href, class: className = '', children } = $props();
</script>

<a {href}>
	<Box class="link-box {className}">
		{@render children?.()}
	</Box>
</a>
