<script>
	/** @type {string} */
	export let href;

	/** @type {string} */
	let className = '';

	export { className as class };
</script>

<a
	{...$$restProps}
	{href}
	class="inline-flex gap-2 underline decoration-indigo-500 decoration-2 underline-offset-4 hover:text-indigo-400 {className}"
>
	<slot />
</a>
