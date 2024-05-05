<script>
	import Divider from '$lib/components/Divider.svelte';
	import HistoryButtons from './HistoryButtons.svelte';
	import FontFormatButtons from './FontFormatButtons.svelte';
	import ElementAlignmentSelect from './ElementAlignmentSelect.svelte';
	import FontSelect from './FontSelect.svelte';
</script>

<div class="flex gap-2">
	<HistoryButtons />
	<Divider />
	<FontSelect />
	<FontFormatButtons />
	<Divider />
	<ElementAlignmentSelect />
</div>
