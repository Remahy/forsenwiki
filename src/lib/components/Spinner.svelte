<script>
	import { LoaderCircleIcon } from '@lucide/svelte';

	let { size = undefined } = $props();
</script>

<div role="status" class="inline-block animate-spin">
	<LoaderCircleIcon {size} />
	<span class="sr-only">Loading...</span>
</div>
