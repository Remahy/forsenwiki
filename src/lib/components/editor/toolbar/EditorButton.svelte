<script>
	import Button from '$lib/components/Button.svelte';

	/** @type {string | undefined} */
	/**
	 * @typedef {Object} Props
	 * @property {boolean | undefined} [isActive]
	 * @property {string} [class]
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props & { [key: string]: any }} */
	let { isActive = undefined, class: className = '', children, ...rest } = $props();

	let fullClassName = $derived(
		typeof isActive === 'boolean' ? `${isActive ? 'active' : 'inactive'} ${className}` : className
	);
</script>

<Button
	on:click
	{...rest}
	class="relative max-h-8! min-h-8! max-w-8! min-w-8! p-0! {fullClassName}"
>
	<div class="flex items-center">
		{@render children?.()}
	</div>
</Button>
