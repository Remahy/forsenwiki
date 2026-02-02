<script>
	import InsertButton from './InsertButton/index.svelte';
	import ImageButtons from './ImageButtons/index.svelte';
	import VideoButtons from './VideoButtons/index.svelte';
	import TableButtons from './TableButtons/index.svelte';
	import FloatBlockButtons from './FloatBlockButtons/index.svelte';
</script>

<div class="flex flex-wrap items-stretch gap-2">
	<InsertButton />
</div>
<div class="flex flex-wrap items-stretch gap-2">
	<FloatBlockButtons />
</div>
<div class="flex flex-wrap items-stretch gap-2">
	<TableButtons />
</div>
<div class="flex flex-wrap items-stretch gap-2">
	<ImageButtons />
</div>
<div class="flex flex-wrap items-stretch gap-2">
	<VideoButtons />
</div>
