<script>
	import { createBubbler } from 'svelte/legacy';

	const bubble = createBubbler();
	/**
	 * @typedef {Object} Props
	 * @property {string} [class]
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props & { [key: string]: any }} */
	let { class: className = '', children, ...rest } = $props();
</script>

<button
	type="button"
	onclick={bubble('click')}
	{...rest}
	class="button flex min-h-10 min-w-10 items-center justify-center gap-2 {className}"
>
	{@render children?.()}
</button>
