<script>
	import Divider from '$lib/components/Divider.svelte';
	import HistoryButtons from './HistoryButtons.svelte';
	import TextFormatButtons from './TextFormatButtons/index.svelte';
	import ElementAlignmentSelect from './ElementAlignmentSelect.svelte';
	import FontSelect from './FontSelect.svelte';
	import ElementSelect from './ElementSelect.svelte';
	import InsertButton from './InsertButton/index.svelte';
	import ImageButtons from './ImageButtons/index.svelte'
</script>

<div class="flex gap-2 flex-wrap">
	<HistoryButtons />
	<Divider />
	<ElementSelect />
	<FontSelect />
	<TextFormatButtons />
	<Divider />
	<ElementAlignmentSelect />
	<Divider />
	<InsertButton />
	<Divider />
	<ImageButtons />
</div>
