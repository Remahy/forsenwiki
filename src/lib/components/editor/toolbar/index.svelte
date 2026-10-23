<script>
	import Divider from '$lib/components/Divider.svelte';

	import FormatControls from './FormatControls.svelte';
	import HistoryButtons from './HistoryButtons.svelte';
</script>

<HistoryButtons />

<Divider />

<div class="flex min-w-0 flex-1 items-stretch gap-1 overflow-x-auto py-2">
	<FormatControls />
</div>
