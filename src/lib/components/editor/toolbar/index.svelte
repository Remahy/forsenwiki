<script>
	import Divider from '$lib/components/Divider.svelte';

	import HistoryButtons from './HistoryButtons.svelte';
	import TextFormatButtons from './TextFormatButtons/index.svelte';
	import ElementAlignmentSelect from './ElementAlignmentSelect.svelte';
	import FontSelect from './FontSelect.svelte';
	import ElementSelect from './ElementSelect.svelte';
	import InsertButton from './InsertButton/index.svelte';
	import ImageButtons from './ImageButtons/index.svelte';
	import VideoButtons from './VideoButtons/index.svelte';
	import TableButtons from './TableButtons/index.svelte';
	import FloatBlockButtons from './FloatBlockButtons/index.svelte';
</script>

<div class="flex flex-wrap items-stretch gap-2">
	<HistoryButtons />
	<Divider />
	<ElementSelect />
	<FontSelect />
	<TextFormatButtons />
	<Divider />
	<ElementAlignmentSelect />
	<Divider />
	<InsertButton />

	<FloatBlockButtons />
	<TableButtons />
	<ImageButtons />
	<VideoButtons />
</div>
