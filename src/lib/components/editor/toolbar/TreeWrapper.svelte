<script>
	import Treeview from '../Treeview/index.svelte';
	import { treeviewState } from '../Treeview/treeviewState.svelte';
	import Image from './Image/index.svelte';
	import Video from './Video/index.svelte';
	import Table from './Table/index.svelte';
	import FloatBlock from './FloatBlock/index.svelte';
	import Link from './Link/index.svelte';
	import Globals from './Globals/index.svelte';
	import InsertButton from './InsertButton/index.svelte';

	let selectedNode = $derived(treeviewState.selected);
</script>

<div class="px-2 pt-2">
	<InsertButton />
</div>

<div class="flex w-full grow flex-col justify-items-stretch overflow-hidden">
	<div class="bg-violet-900/25 p-4 font-mono leading-none select-none" title="Nodes">Nodes</div>

	<Treeview />
</div>

<div class="flex flex-wrap items-stretch gap-2">
	<FloatBlock {selectedNode} />
	<Table {selectedNode} />
	<Image {selectedNode} />
	<Video {selectedNode} />
	<Link {selectedNode} />
	<Globals />
</div>
