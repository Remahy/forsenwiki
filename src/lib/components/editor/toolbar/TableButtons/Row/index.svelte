<script>
	import { $isTableNode as isTableNode, $isTableRowNode as isTableRowNode } from '@lexical/table';
	import EditRow from './EditRow.svelte';

	/**
	 * @type {{ selectedTable: import('@lexical/table').TableNode, selectedNode: LexicalNode | null }}
	 */
	let { selectedTable, selectedNode = null } = $props();
</script>

{#if isTableRowNode(selectedNode) && isTableNode(selectedTable)}
	<div class="flex w-full flex-col justify-items-stretch">
		<div class="violet p-4 font-mono leading-none select-none" title="Row">Row</div>

		<div class="min-h-32 p-2">
			<EditRow {selectedTable} {selectedNode} />
		</div>
	</div>
{/if}
