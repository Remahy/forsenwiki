<script>
	import Treeview from '../Treeview/index.svelte';
	import { treeviewState } from '../Treeview/treeviewState.svelte';
	import Image from './Image/index.svelte';
	import Video from './Video/index.svelte';
	import Table from './Table/index.svelte';
	import FloatBlock from './FloatBlock/index.svelte';
	import Link from './Link/index.svelte';

	let selectedNode = $derived(treeviewState.selected);
</script>

<Treeview />

<div class="flex flex-wrap items-stretch gap-2">
	<FloatBlock {selectedNode} />
	<Table {selectedNode} />
	<Image {selectedNode} />
	<Video {selectedNode} />
	<Link {selectedNode} />
</div>
