<script>
	import {
		$isTableNode as isTableNode,
		$isTableCellNode as isTableCellNode,
		$deleteTableColumnAtSelection as deleteTableColumnAtSelection,
	} from '@lexical/table';
	import { getEditor } from 'svelte-lexical';
	import Wrapper from '../../components/Wrapper.svelte';
	import Title from '../../components/Title.svelte';
	import DeleteNodeButton from '../../components/DeleteNodeButton.svelte';
	import EditColumn from './EditColumn.svelte';

	/**
	 * @type {{ selectedTable: LexicalNode, selectedNode: LexicalNode }}
	 */
	let { selectedTable, selectedNode } = $props();

	const editor = getEditor();

	const handleDeleteColumn = () => {
		editor.update(() => {
			if (!isTableCellNode(selectedNode)) {
				return;
			}

			selectedNode.selectEnd();

			deleteTableColumnAtSelection();
		});
	};
</script>

{#if isTableCellNode(selectedNode) && isTableNode(selectedTable)}
	<Wrapper>
		{#snippet title()}
			<Title {selectedNode} text="Column" hasDefaultDelete={false}>
				<DeleteNodeButton onClick={handleDeleteColumn} />
			</Title>
		{/snippet}

		{#snippet content()}
			<div class="p-2">
				<EditColumn {selectedTable} selectedCell={selectedNode} />
			</div>
		{/snippet}
	</Wrapper>
{/if}
