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

	let fullClassName =
		$derived(typeof isActive === 'boolean' ? `${isActive ? 'active' : 'inactive'} ${className}` : className);
</script>

<Button
	on:click
	{...rest}
	class="!max-h-8 !min-h-8 !min-w-8 !max-w-8 lg:!max-h-[unset] lg:!min-h-[unset] {fullClassName}"
>
	<div class="relative -m-2 flex items-center p-2">
		{@render children?.()}
	</div>
</Button>
