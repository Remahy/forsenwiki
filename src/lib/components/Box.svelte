<script>
	/**
	 * @typedef {Object} Props
	 * @property {string} [class]
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props & { [key: string]: any }} */
	let { class: className = '', children, ...rest } = $props();
</script>

<div {...rest} class="box rounded-sm {className}">
	{@render children?.()}
</div>
