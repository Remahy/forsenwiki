<script>
	import ImageButtons from './ImageButtons/index.svelte';
	import VideoButtons from './VideoButtons/index.svelte';
	import TableButtons from './TableButtons/index.svelte';
	import FloatBlockButtons from './FloatBlockButtons/index.svelte';
	import Link from './Link/index.svelte';
	import Treeview from '../Treeview/index.svelte';
	import { treeviewState } from '../Treeview/treeviewState.svelte';

	let selectedNode = $derived(treeviewState.selected);
</script>

<Treeview />

<div class="flex flex-wrap items-stretch gap-2">
	<FloatBlockButtons {selectedNode} />
	<TableButtons {selectedNode} />
	<ImageButtons {selectedNode} />
	<VideoButtons {selectedNode} />
	<Link {selectedNode} />
</div>
