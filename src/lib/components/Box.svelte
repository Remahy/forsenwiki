<script>
	/**
	 * @typedef {Object} Props
	 * @property {string} [class]
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props} */
	let { class: className = '', children } = $props();
</script>

<div class="box rounded-sm {className}">
	{@render children?.()}
</div>
