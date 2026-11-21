<script>
	/* eslint-disable svelte/no-navigation-without-resolve */
	import Box from './Box.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {string} href
	 * @property {string} label
	 * @property {string} [class]
	 * @property {string} [style]
	 * @property {string} [id]
	 * @property {string} [target]
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props} */
	let { href, label, class: className = '', style, id, children, target } = $props();
</script>

<Box {id} {style} class="link-box {className}">
	<a {href} {target} aria-label={label} class="link-box-link"></a>
	{@render children?.()}
</Box>
