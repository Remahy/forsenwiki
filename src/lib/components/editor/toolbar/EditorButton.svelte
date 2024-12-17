<script>
	import Button from '$lib/components/Button.svelte';
	/** @type {boolean | undefined} */
	export let isActive = undefined;

	/** @type {string | undefined} */
	let className = '';

	export { className as class };

	$: fullClassName =
		typeof isActive === 'boolean' ? `${isActive ? 'active' : 'inactive'} ${className}` : className;
</script>

<Button
	{...$$restProps}
	class="!max-h-8 !min-h-8 !min-w-8 !max-w-8 lg:!max-h-[unset] lg:!min-h-[unset] {fullClassName}"
>
	<div class="relative -m-2 flex items-center p-2">
		<slot />
	</div>
</Button>
