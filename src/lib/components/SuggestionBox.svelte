<script>
	/** @type {string} */
	let className = '';

	export { className as class };
</script>

<div {...$$restProps} class="suggestion-box mb-4 w-full {className}">
	<slot />
</div>
