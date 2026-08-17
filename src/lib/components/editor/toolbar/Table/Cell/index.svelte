<script>
	import { $isTableNode as isTableNode, $isTableCellNode as isTableCellNode } from '@lexical/table';
	import Title from '../../components/Title.svelte';
	import EditCell from './EditCell.svelte';

	/**
	 * @type {{ selectedTable: LexicalNode, selectedNode: LexicalNode }}
	 */
	let { selectedTable, selectedNode } = $props();
</script>

{#if isTableCellNode(selectedNode) && isTableNode(selectedTable)}
	<div class="flex w-full flex-col justify-items-stretch">
		<Title {selectedNode} text="Cell" />

		<div class="min-h-32 p-2">
			<EditCell {selectedTable} {selectedNode} />
		</div>
	</div>
{/if}
