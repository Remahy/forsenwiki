<script>
	const { src, contentType } = $props();
</script>

<video controls class="mx-auto aspect-video min-h-32">
	<source {src} type={contentType} />
</video>
