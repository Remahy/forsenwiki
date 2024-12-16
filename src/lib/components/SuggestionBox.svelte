<script>

	/** @type {string} */
	let className = '';

	export { className as class };
</script>

<div
class="text-slate-600 dark:text-slate-400 m-0 my-4 mt-0 w-full rounded bg-gradient-to-br from-sky-100 to-violet-200 p-4 dark:from-slate-950/30 dark:to-violet-900/30  {className}" {...$$restProps}
>
	<slot />
</div>