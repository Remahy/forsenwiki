<script>
	/** @type {string} */
	export let href;

	export let reload = false;

	/** @type {string} */
	let className = '';

	export { className as class };
</script>

<a href={href} data-sveltekit-reload={reload} class="rounded bg-violet-600 py-2 px-4 font-medium text-white hover:bg-violet-800 {className}" {...$$restProps}>
	<slot />
</a>
