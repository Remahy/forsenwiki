<script>
	/**
	 * @typedef {Object} Props
	 * @property {string} href
	 * @property {string} [class]
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props & { [key: string]: any }} */
	let { href, class: className = '', children, ...rest } = $props();
</script>

<a {...rest} {href} class="link inline-flex gap-2 {className}">
	{@render children?.()}
</a>
