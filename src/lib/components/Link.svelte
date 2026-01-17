<script>
	/**
	 * @typedef {Object} Props
	 * @property {string} href
	 * @property {string} [class]
	 * @property {boolean} [reload]
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props & { [key: string]: any }} */
	let { href, class: className = '', children, reload, ...rest } = $props();
</script>

<a {...rest} {href} data-sveltekit-reload={reload} class="link {className}">
	{@render children?.()}
</a>
