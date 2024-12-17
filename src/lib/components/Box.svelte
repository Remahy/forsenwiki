<script>
	/** @type {string} */
	let className = '';

	export { className as class };
</script>

<div class="box rounded {className}">
	<slot />
</div>
