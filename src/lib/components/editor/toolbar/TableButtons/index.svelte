<script>
	import { onMount } from 'svelte';
	import { mergeRegister } from 'lexical';
	import { $isTableNode as isTableNode } from '@lexical/table';
	import { getEditor } from 'svelte-lexical';

	import Row from './Row/index.svelte';
	import Column from './Column/index.svelte';
	import Cell from './Cell/index.svelte';

	/**
	 * @type {{ selectedNode: LexicalNode | null }}
	 */
	let { selectedNode = null } = $props();

	/** @type {import('$lib/lexical/custom').ATableNode | null} */
	let selectedTable = $state(null);

	const editor = getEditor();

	const updateToolbar = () => {
		editor.read(() => {
			if (!selectedNode) {
				selectedTable = null;
				return;
			}

			const closestParentTable = selectedNode.getParents().find((node) => isTableNode(node));

			if (!closestParentTable) {
				selectedTable = null;
				return;
			}

			selectedTable = closestParentTable;
		});
	};

	onMount(() => {
		return mergeRegister(
			editor.registerUpdateListener(() => {
				updateToolbar();
			})
		);
	});
</script>

{#if selectedTable && selectedNode}
	<Row {selectedTable} {selectedNode} />
	<Column {selectedTable} {selectedNode} />
	<Cell {selectedTable} {selectedNode} />
{/if}
