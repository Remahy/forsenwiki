<script>
	export let isActive = false;
</script>

<button
	on:click
	{...$$restProps}
	class="rounded bg-violet-700 p-2 text-white hover:bg-violet-800 disabled:opacity-25 {isActive
		? 'border border-violet-950 bg-violet-900'
		: 'border border-opacity-0'}"
>
	<slot />
</button>
