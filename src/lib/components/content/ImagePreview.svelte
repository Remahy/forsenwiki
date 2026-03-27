<script>
	const { src, name, className = '' } = $props();
</script>

<img {src} alt={name} class="
	mx-auto min-h-32 w-fit max-w-full
	{className}" />
