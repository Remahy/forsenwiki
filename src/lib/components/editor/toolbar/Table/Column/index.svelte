<script>
	import { $isTableNode as isTableNode, $isTableCellNode as isTableCellNode } from '@lexical/table';
	import EditColumn from './EditColumn.svelte';

	/**
	 * @type {{ selectedTable: LexicalNode, selectedNode: LexicalNode }}
	 */
	let { selectedTable, selectedNode } = $props();
</script>

{#if isTableCellNode(selectedNode) && isTableNode(selectedTable)}
	<div class="flex w-full flex-col justify-items-stretch">
		<div class="violet px-2 py-4 font-mono leading-none select-none" title="Column">Column</div>

		<div class="p-2">
			<EditColumn {selectedTable} selectedCell={selectedNode} />
		</div>
	</div>
{/if}
