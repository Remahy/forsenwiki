<script>
	export let ref;

	/**
	 * @type {any}
	 */
	 export let value;

	let className = '';
	export { className as class };
</script>

<select on:change on:click bind:value bind:this={ref} {...$$restProps} class="rounded p-1 pr-10 text-sm bg-transparent h-full {className} dark:*:bg-black dark:border-violet-900">
	<slot />
</select>
