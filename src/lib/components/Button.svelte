<script>
	export let isActive = false;
	/** @type {string | undefined} */
	let className = '';

	export { className as class };
</script>

<button
	on:click
	{...$$restProps}
	class="flex min-h-10 min-w-10 items-center justify-center gap-2 rounded bg-violet-600 p-2 font-medium text-white hover:bg-violet-800 disabled:opacity-25 dark:border-0 {isActive
		? 'border border-violet-950 !bg-violet-950'
		: 'border border-opacity-0'} {className}"
>
	<slot />
</button>
