<script>
	import { $isTableNode as isTableNode, $isTableRowNode as isTableRowNode } from '@lexical/table';
	import Wrapper from '../../components/Wrapper.svelte';
	import Title from '../../components/Title.svelte';
	import EditRow from './EditRow.svelte';

	/**
	 * @type {{ selectedTable: LexicalNode, selectedNode: LexicalNode }}
	 */
	let { selectedTable, selectedNode } = $props();
</script>

{#if isTableRowNode(selectedNode) && isTableNode(selectedTable)}
	<Wrapper>
		{#snippet title()}
			<Title {selectedNode} text="Row" />
		{/snippet}

		{#snippet content()}
			<div class="p-2">
				<EditRow {selectedTable} {selectedNode} />
			</div>
		{/snippet}
	</Wrapper>
{/if}
