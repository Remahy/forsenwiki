<script>
	const { url } = $props();

	const hostname = $derived.by(() => {
		try {
			return new URL(url).hostname;
		} catch {
			return url;
		}
	});
</script>

<div class="flex flex-col gap-2 break-all">
	<strong>{hostname}</strong>
	<small>{url}</small>
</div>
