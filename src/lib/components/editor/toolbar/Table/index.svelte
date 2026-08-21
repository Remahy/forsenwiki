<script>
	import { $getSelection as getSelection, $isRangeSelection as isRangeSelection } from 'lexical';
	import { $isTableCellNode as isTableCellNode, $isTableNode as isTableNode } from '@lexical/table';
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

	/** @type {import('$lib/lexical/custom').ATableCellNode | null} */
	let selectedCell = $state(null);

	const editor = getEditor();

	const updateToolbar = () => {
		editor.read(() => {
			if (!selectedNode) {
				selectedTable = null;
				return;
			}

			if (!selectedNode.isAttached()) {
				return;
			}

			const parents = selectedNode.getParents();

			const closestParentTable = parents.find((node) => isTableNode(node));
			if (!closestParentTable) {
				selectedTable = null;
				return;
			}

			selectedTable = closestParentTable;

			if (isTableCellNode(selectedNode)) {
				selectedCell = selectedNode;
				return;
			}

			const cellIndex = parents.findIndex((node) => isTableCellNode(node));

			if (cellIndex > 1) {
				selectedTable = null;
				selectedCell = null;
				return;
			}

			const selection = getSelection();

			if (isRangeSelection(selection)) {
				selectedCell = /** @type {import('$lib/lexical/custom').ATableCellNode} */ (
					parents[cellIndex]
				);
			} else {
				selectedCell = null;
			}
		});
	};

	$effect(() => {
		updateToolbar();
		() => [selectedNode];
	});
</script>

{#if selectedTable && selectedNode}
	<Row {selectedTable} {selectedNode} />

	{#if selectedCell}
		<Column {selectedTable} selectedNode={selectedCell} />
		<Cell {selectedTable} selectedNode={selectedCell} />
	{/if}
{/if}
