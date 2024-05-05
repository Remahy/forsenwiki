<script>
	export let isActive = false;
</script>

<button
	on:click
	{...$$restProps}
	class="rounded bg-blue-300 p-2 disabled:opacity-25 {isActive
		? 'border border-blue-950 bg-blue-500'
		: 'border border-opacity-0'}"
>
	<slot />
</button>
