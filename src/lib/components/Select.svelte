<script>
	export let ref;
</script>

<select on:change on:click bind:this={ref} {...$$restProps} class="rounded p-1 pr-10 text-sm">
	<slot />
</select>
