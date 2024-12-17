<script>
	/** @type {string | undefined} */
	let className = '';

	export { className as class };
</script>

<button
	on:click
	{...$$restProps}
	class="button flex min-h-10 min-w-10 items-center justify-center gap-2 {className}"
>
	<slot />
</button>
