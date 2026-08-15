<script>
	import { onMount } from 'svelte';
	import { $getSelection as getSelection, mergeRegister } from 'lexical';
	import { $isTableNode as isTableNode } from '@lexical/table';
	import { getEditor } from 'svelte-lexical';

	import Row from './Row/index.svelte';
	import ColumnButtons from './ColumnButtons.svelte';
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
			const selection = getSelection();

			if (!selection?.isCollapsed) {
				selectedTable = null;
				return;
			}

			const [node] = selection.getNodes();

			if (!node) {
				selectedTable = null;
				return;
			}

			const closestParentTable = node.getParents().find((node) => isTableNode(node));

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

{#if selectedTable}
	<Row {selectedTable} {selectedNode} />
	<ColumnButtons {selectedTable} />
	<Cell {selectedTable} {selectedNode} />
{/if}
