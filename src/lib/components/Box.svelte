<script>
	/** @type {string | undefined} */
	let className = undefined;

	export { className as class };
</script>

<div class="rounded bg-violet-200 {className}">
	<slot />
</div>
