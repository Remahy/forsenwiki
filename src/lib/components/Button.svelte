<script>
	export let isActive = false;
	/** @type {string | undefined} */
	let className = undefined;

	export { className as class };
</script>

<button
	on:click
	{...$$restProps}
	class="flex items-center gap-2 rounded bg-violet-700 p-2 text-white hover:bg-violet-800 disabled:opacity-25 {isActive
		? 'border border-violet-950 bg-violet-900'
		: 'border border-opacity-0'} {className}"
>
	<slot />
</button>
