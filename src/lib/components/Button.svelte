<script>
	export let isActive = false;
	/** @type {string | undefined} */
	let className = undefined;

	export { className as class };
</script>

<button
	on:click
	{...$$restProps}
	class="flex items-center justify-center gap-2 rounded bg-violet-500 p-2 min-w-10 min-h-10 text-white hover:bg-violet-800 disabled:opacity-25 {isActive
		? 'border border-violet-950 !bg-violet-950'
		: 'border border-opacity-0'} {className}"
>
	<slot />
</button>
