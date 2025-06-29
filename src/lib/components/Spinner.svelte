<script>
	import { Loader2Icon } from 'lucide-svelte';

	let { size = undefined } = $props();
</script>

<div role="status" class="inline-block animate-spin">
	<Loader2Icon {size} />
	<span class="sr-only">Loading...</span>
</div>
