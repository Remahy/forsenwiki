<script>
	/** @type {string} */
	let className = '';

	export { className as class };
</script>

<div class="container mx-auto flex grow flex-col gap-4 p-4 lg:py-12 {className}">
	<slot />
</div>
