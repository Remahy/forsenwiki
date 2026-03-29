<script>
	import { LoaderCircleIcon } from '@lucide/svelte';

	let { size = undefined } = $props();
</script>

<span role="status" class="inline-block animate-spin">
	<LoaderCircleIcon {size} />
	<span class="sr-only">Loading...</span>
</span>
