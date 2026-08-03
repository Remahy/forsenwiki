<script>
	import ImageButtons from './ImageButtons/index.svelte';
	import VideoButtons from './VideoButtons/index.svelte';
	import TableButtons from './TableButtons/index.svelte';
	import FloatBlockButtons from './FloatBlockButtons/index.svelte';
	import Treeview from '../Treeview/index.svelte';
</script>

<div class="flex flex-wrap items-stretch gap-2 overflow-y-auto p-2">
	<Treeview />
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
