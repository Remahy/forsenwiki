<script>
	import { onMount } from 'svelte';
	import { $getSelection as getSelection } from 'lexical';
	import { getEditor } from 'svelte-lexical';
	import { mergeRegister } from '@lexical/utils';
	import { $isTableNode as isTableNode } from '@lexical/table';

	import Divider from '$lib/components/Divider.svelte';
	import RowButtons from './RowButtons.svelte';
	import ColumnButtons from './ColumnButtons.svelte';

	/** @type {import("@lexical/table").TableNode | null} */
	let selectedTable = null;

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

			selectedTable = closestParentTable;
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

	<div class="flex items-center gap-2">
		<div
			class="flex select-none flex-col items-center justify-center font-mono text-xs leading-none"
		>
			<span>T</span>
			<span>B</span>
			<span>L</span>
		</div>

		<RowButtons {selectedTable} />
		<ColumnButtons {selectedTable} />
	</div>
{/if}
