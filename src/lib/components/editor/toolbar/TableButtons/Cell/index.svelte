<script>
	import { $isTableNode as isTableNode, $isTableCellNode as isTableCellNode } from '@lexical/table';
	import EditCell from './EditCell.svelte';

	/**
	 * @type {{ selectedTable: LexicalNode, selectedNode: LexicalNode }}
	 */
	let { selectedTable, selectedNode } = $props();
</script>

{#if isTableCellNode(selectedNode) && isTableNode(selectedTable)}
	<div class="flex w-full flex-col justify-items-stretch">
		<div class="violet p-4 font-mono leading-none select-none" title="Cell">Cell</div>

		<div class="min-h-32 p-2">
			<EditCell {selectedTable} selectedNode={selectedNode} />
		</div>
	</div>
{/if}
