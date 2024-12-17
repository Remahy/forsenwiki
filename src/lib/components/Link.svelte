<script>
	/** @type {string} */
	export let href;

	/** @type {string} */
	let className = '';

	export { className as class };
</script>

<a {...$$restProps} {href} class="link inline-flex gap-2 {className}">
	<slot />
</a>
