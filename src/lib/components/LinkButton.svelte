<script>
	/**
	 * @typedef {Object} Props
	 * @property {string} href
	 * @property {boolean} [reload]
	 * @property {string} [class]
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props & { [key: string]: any }} */
	let {
		href,
		reload = false,
		class: className = '',
		children,
		...rest
	} = $props();
</script>

<a {href} data-sveltekit-reload={reload} class="link-button {className}" {...rest}>
	{@render children?.()}
</a>
