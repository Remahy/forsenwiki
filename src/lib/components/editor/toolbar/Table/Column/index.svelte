<script>
	import { $isTableNode as isTableNode, $isTableCellNode as isTableCellNode } from '@lexical/table';
	import Title from '../../components/Title.svelte';
	import EditColumn from './EditColumn.svelte';

	/**
	 * @type {{ selectedTable: LexicalNode, selectedNode: LexicalNode }}
	 */
	let { selectedTable, selectedNode } = $props();
</script>

{#if isTableCellNode(selectedNode) && isTableNode(selectedTable)}
	<div class="flex w-full flex-col justify-items-stretch">
		<Title {selectedNode} text="Column" />

		<div class="p-2">
			<EditColumn {selectedTable} selectedCell={selectedNode} />
		</div>
	</div>
{/if}
