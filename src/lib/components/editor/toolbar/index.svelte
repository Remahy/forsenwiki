<script>
	import Divider from '$lib/components/Divider.svelte';
	import HistoryButtons from './HistoryButtons.svelte';
	import FontFormatButtons from './FontFormatButtons.svelte';
	import FontButtons from './FontButtons.svelte';
	import ElementFormatButtons from './ElementFormatButtons.svelte';
</script>

<div class="flex gap-2">
	<HistoryButtons />
	<Divider />
	<!-- FontButtons /-->
	<FontFormatButtons />
	<Divider />
	<ElementFormatButtons />
</div>
