<script>
	/** @type {string | undefined} */
	let className = undefined;

	export { className as class };
</script>

<div class="rounded bg-violet-200 dark:bg-violet-950 dark:bg-opacity-30 {className}">
	<slot />
</div>
