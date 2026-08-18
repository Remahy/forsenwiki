<script>
	import { $isTableNode as isTableNode, $isTableRowNode as isTableRowNode } from '@lexical/table';
	import Title from '../../components/Title.svelte';
	import EditRow from './EditRow.svelte';

	/**
	 * @type {{ selectedTable: LexicalNode, selectedNode: LexicalNode }}
	 */
	let { selectedTable, selectedNode } = $props();
</script>

{#if isTableRowNode(selectedNode) && isTableNode(selectedTable)}
	<div class="flex w-full flex-col justify-items-stretch">
		<Title {selectedNode} text="Row" />

		<div class="p-2">
			<EditRow {selectedTable} {selectedNode} />
		</div>
	</div>
{/if}
