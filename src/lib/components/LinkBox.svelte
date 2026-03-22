<script>
	import Box from './Box.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {string} href
	 * @property {string} [class]
	 * @property {string} [style]
	 * @property {string} [id]
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props} */
	let { href, class: className = '', style, id, children } = $props();
</script>

<a {href} {id} {style}>
	<Box class="link-box {className}">
		{@render children?.()}
	</Box>
</a>
