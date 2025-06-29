<script>
	/**
	 * @typedef {Object} Props
	 * @property {string} [class]
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props & { [key: string]: any }} */
	let { class: className = '', children, ...rest } = $props();
</script>

<div {...rest} class="suggestion-box mb-4 w-full {className}">
	{@render children?.()}
</div>
