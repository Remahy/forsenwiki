<script>
	export let ref;

	/**
	 * @type {any}
	 */
	 export let value;

	let className = '';
	export { className as class };
</script>

<select on:change on:click bind:value bind:this={ref} {...$$restProps} class="rounded p-1 pr-10 text-sm h-full {className}">
	<slot />
</select>
