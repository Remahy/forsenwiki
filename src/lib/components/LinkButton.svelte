<script>
	/** @type {string} */
	export let href;

	export let reload = false;

	/** @type {string} */
	let className = '';

	export { className as class };
</script>

<a {href} data-sveltekit-reload={reload} class="link-button {className}" {...$$restProps}>
	<slot />
</a>
