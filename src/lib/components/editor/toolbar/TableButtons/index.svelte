<script>
	import { onMount } from 'svelte';
	import { $getSelection as getSelection, mergeRegister } from 'lexical';
	import { $isTableCellNode as isTableCellNode, $isTableNode as isTableNode } from '@lexical/table';
	import { getEditor } from 'svelte-lexical';

	import Divider from '$lib/components/Divider.svelte';
	import RowButtons from './RowButtons.svelte';
	import ColumnButtons from './ColumnButtons.svelte';
	import EditCell from './EditCell.svelte';

	/** @type {import('@lexical/table').TableNode | null} */
	let selectedTable = $state(null);
	/** @type {import('@lexical/table').TableCellNode | null} */
	let selectedCell = $state(null);

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

			const closestCellNode = node.getParents().find((node) => isTableCellNode(node));

			if (!closestCellNode) {
				selectedCell = null;
				return;
			}

			selectedTable = closestParentTable;
			selectedCell = closestCellNode;
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
	<Divider />

	<div
		class="
		flex flex-col items-center justify-center font-mono text-xs leading-none
		select-none
	"
	>
		<span>T</span>
		<span>B</span>
		<span>L</span>
	</div>

	<RowButtons {selectedTable} />
	<ColumnButtons {selectedTable} />
	<EditCell {selectedTable} {selectedCell} />
{/if}
