<script>
	import Box from './Box.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {string} href
	 * @property {string} [class]
	 * @property {string} [style]
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props} */
	let { href, class: className = '', style = '', children } = $props();
</script>

<a {href} style={style}>
	<Box class="link-box {className}">
		{@render children?.()}
	</Box>
</a>
