<script>
	import { ChevronDownIcon, ChevronRightIcon } from '@lucide/svelte';
	import Treeview from '../Treeview/index.svelte';
	import { getExtensionDependencyFromEditor } from '@lexical/extension';
	import { getEditor } from '$lib/components/editor/context';
	import { fromSignal } from '$lib/utils/fromSignal.svelte';
	import { TreeviewExtension } from '../Treeview/TreeviewExtension';
	import Title from './components/Title.svelte';
	import Image from './Image/index.svelte';
	import Video from './Video/index.svelte';
	import Table from './Table/index.svelte';
	import FloatBlock from './FloatBlock/index.svelte';
	import Link from './Link/index.svelte';
	import Globals from './Globals/index.svelte';
	import InsertButton from './InsertButton/index.svelte';
	import Gallery from './Gallery/index.svelte';

	const selected = fromSignal(
		getExtensionDependencyFromEditor(getEditor(), TreeviewExtension).output.selected
	);
	let selectedNode = $derived(selected.current);

	let isOpen = $state(true);
</script>

<div class="p-2">
	<InsertButton />
</div>

<div class="flex w-full flex-col justify-items-stretch overflow-hidden">
	<button
		type="button"
		class="button-bg flex items-center gap-2 pl-2 text-start hover:cursor-pointer"
		onclick={() => (isOpen = !isOpen)}
	>
		{#if isOpen}
			<ChevronDownIcon />
		{:else}
			<ChevronRightIcon />
		{/if}
		<div class="grow">
			<Title text="Nodes" hasDefaultDelete={false} />
		</div>
	</button>
	{#if isOpen}
		<Treeview />
	{/if}
</div>

<div class="flex flex-wrap items-stretch">
	<FloatBlock {selectedNode} />
	<Table {selectedNode} />
	<Image {selectedNode} />
	<Video {selectedNode} />
	<Link {selectedNode} />
	<Gallery {selectedNode} />
	<Globals />
</div>
