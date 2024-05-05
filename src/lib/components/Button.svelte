<script>
	export let isActive = false;
</script>

<button
	on:click
	{...$$restProps}
	class="rounded bg-fuchsia-300 p-2 disabled:opacity-25 hover:bg-fuchsia-400 {isActive
		? 'border border-fuchsia-950 bg-fuchsia-500'
		: 'border border-opacity-0'}"
>
	<slot />
</button>
