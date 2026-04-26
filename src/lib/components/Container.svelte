<script>
	/**
	 * @typedef {Object} Props
	 * @property {string} [class]
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props} */
	let { class: className = '', children } = $props();
</script>

<div class="container mx-auto flex grow flex-col gap-4 p-4 lg:py-12 {className}">
	{@render children?.()}
</div>
