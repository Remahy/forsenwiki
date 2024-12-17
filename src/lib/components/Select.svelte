<script>
	export let ref;

	/**
	 * @type {any}
	 */
	export let value;

	let className = '';
	export { className as class };
</script>

<select on:change on:click bind:value bind:this={ref} {...$$restProps} class="select {className}">
	<slot />
</select>
