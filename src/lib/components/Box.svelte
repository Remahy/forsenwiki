<script>
	/** @type {string} */
	let className = '';

	export { className as class };
</script>

<div class="rounded bg-stone-100 dark:bg-slate-950 dark:bg-opacity-35 outline outline-1 dark:outline-slate-800 outline-neutral-300 {className}">
	<slot />
</div>
