<script>
	import Divider from '$lib/components/Divider.svelte';
	import HistoryButtons from './HistoryButtons.svelte';
	import FontFormatButtons from './FontFormatButtons.svelte';
	import ElementAlignmentSelect from './ElementAlignmentSelect.svelte';
	import FontSelect from './FontSelect.svelte';
	import ElementSelect from './ElementSelect.svelte';
</script>

<div class="flex gap-2 flex-wrap">
	<HistoryButtons />
	<Divider />
	<ElementSelect />
	<Divider />
	<FontSelect />
	<FontFormatButtons />
	<Divider />
	<ElementAlignmentSelect />
</div>
