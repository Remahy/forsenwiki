<script>
	const { src, contentType } = $props();
</script>

<video controls class="mx-auto min-h-32 aspect-video">
	<source src={src} type={contentType} />
</video>
