<script>
	import { $isTableNode as isTableNode, $isTableCellNode as isTableCellNode } from '@lexical/table';
	import Wrapper from '../../components/Wrapper.svelte';
	import Title from '../../components/Title.svelte';
	import EditCell from './EditCell.svelte';

	/**
	 * @type {{ selectedTable: LexicalNode, selectedNode: LexicalNode }}
	 */
	let { selectedTable, selectedNode } = $props();
</script>

{#if isTableCellNode(selectedNode) && isTableNode(selectedTable)}
	<Wrapper>
		{#snippet title()}
			<Title {selectedNode} text="Cell" hasDefaultDelete={false} />
		{/snippet}

		{#snippet content()}
			<div class="p-2">
				<EditCell {selectedTable} {selectedNode} />
			</div>
		{/snippet}
	</Wrapper>
{/if}
