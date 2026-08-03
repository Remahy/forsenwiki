<script>
	import { onMount } from 'svelte';
	import { mergeRegister } from 'lexical';
	import { getEditor } from 'svelte-lexical';
	import { Tree } from '@keenmate/svelte-treeview';
	import { ChevronDownIcon, ChevronRightIcon } from '@lucide/svelte';

	import '@keenmate/svelte-treeview/styles.css';
	import './treeview.css';

	import { useDebounce } from '$lib/utils/debouncer';
	import { createTreeFromEditor } from './utils';
	import { treeviewState } from './treeviewState.svelte';

	const editor = $state(getEditor?.());

	onMount(() => {
		const debouncer = useDebounce(() => {
			treeviewState.tree = createTreeFromEditor(editor);
		}, 100);

		const unregister = mergeRegister(
			editor.registerUpdateListener(() => {
				debouncer();

				// const selection = getSelection();
			})
		);

		return () => {
			unregister();
		};
	});
</script>

<Tree
	data={treeviewState.tree}
	idMember="key"
	pathMember="path"
	displayValueMember="type"
	isSorted
	clickBehavior="select"
	selectionMode="single"
	onNodeClick={(context) => {
		treeviewState.selected = context.node;
	}}
>
	{#snippet nodeTemplate(/** @type {{ data: import('./utils').TreeNode }} */ node)}
		<div class="flex items-center gap-2 font-mono">
			{#if node.data.Icon}
				{@const Icon = node.data.Icon}
				<Icon size="16" />
				<span class="font-semibold">{node.data.label}</span>
			{:else}
				<span class="text-xs">{node.data.label}</span>
			{/if}
		</div>
	{/snippet}

	{#snippet expandIcon(isExpanded, hasChildren)}
		{#if hasChildren}
			{#if isExpanded}
				<ChevronRightIcon />
			{:else}
				<ChevronDownIcon />
			{/if}
		{/if}
	{/snippet}

	{#snippet noData()}
		<span>Focus the editor to render tree view.</span>
	{/snippet}
</Tree>
