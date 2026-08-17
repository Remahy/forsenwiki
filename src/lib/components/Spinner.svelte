<script>
	import { LoaderCircleIcon } from '@lucide/svelte';

	let { size = undefined, class: className = '' } = $props();
</script>

<span role="status" class="inline-block animate-spin {className}">
	<LoaderCircleIcon {size} />
	<span class="sr-only">Loading...</span>
</span>
