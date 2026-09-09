<script>
	const { src, name, className = '' } = $props();
</script>

<img {src} alt={name} class="mx-auto w-full max-w-full {className}" />
