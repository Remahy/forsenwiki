<script>
	import { createBubbler } from 'svelte/legacy';

	const bubble = createBubbler();

	/**
	 * @typedef {Object} Props
	 * @property {any} ref
	 * @property {any} value
	 * @property {string} [class]
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props & { [key: string]: any }} */
	let {
		ref = $bindable(),
		value = $bindable(),
		class: className = '',
		children,
		...rest
	} = $props();
</script>

<select
	onchange={bubble('change')}
	onclick={bubble('click')}
	bind:value
	bind:this={ref}
	{...rest}
	class="select {className}"
>
	{@render children?.()}
</select>
