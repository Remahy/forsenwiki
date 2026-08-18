<script>
	// Based on umaranis' svelte-lexical

	import { onMount } from 'svelte';
	import { PlusIcon, ArrowUpIcon, ArrowDownIcon, Rows3Icon } from '@lucide/svelte';
	import {
		$createNodeSelection as createNodeSelection,
		$setSelection as setSelection,
		mergeRegister,
	} from 'lexical';
	import { getEditor } from 'svelte-lexical';
	import {
		$insertTableRowAtSelection as insertTableRowAtSelection,
		$getTableRowIndexFromTableCellNode as getTableRowIndexFromTableCellNode,
		$isTableRowNode as isTableRowNode,
		$isTableCellNode as isTableCellNode,
		TableCellHeaderStates,
	} from '@lexical/table';

	import Button from '$lib/components/Button.svelte';
	import EditorButton from '../../EditorButton.svelte';

	/**
	 * @typedef Props
	 * @property {import('$lib/lexical/custom').ATableNode} selectedTable
	 * @property {import('@lexical/table').TableRowNode} selectedNode
	 */

	/** @type {Props} */
	let { selectedTable, selectedNode } = $props();

	let isRowHeader = $state(false);

	const editor = getEditor();

	/** @param {boolean} [insertAfter] */
	const onClickAddRow = (insertAfter) => {
		editor.update(() => {
			if (!selectedTable) {
				return;
			}

			const lastDescendant = selectedNode.getLastDescendant();

			if (!lastDescendant) {
				return;
			}

			const tableCellNode = lastDescendant.getParents().find((n) => isTableCellNode(n));

			if (!tableCellNode) {
				return;
			}

			tableCellNode.selectEnd();

			insertTableRowAtSelection(insertAfter);

			const selection = createNodeSelection();
			selection.add(selectedNode.getKey());
			setSelection(selection);
		});
	};

	const toggleTableRowIsHeader = () => {
		editor.update(() => {
			const lastDescendant = selectedNode.getLastDescendant();

			if (!lastDescendant) {
				return;
			}

			const tableCellNode = lastDescendant.getParents().find((n) => isTableCellNode(n));

			if (!tableCellNode) {
				return;
			}

			const tableRowIndex = getTableRowIndexFromTableCellNode(tableCellNode);

			const tableRows = selectedTable.getChildren();

			if (tableRowIndex >= tableRows.length || tableRowIndex < 0) {
				throw new Error('Expected table cell to be inside of table row.');
			}

			const tableRow = tableRows[tableRowIndex];

			if (!isTableRowNode(tableRow)) {
				throw new Error('Expected table row');
			}

			tableRow.getChildren().forEach((tableCell) => {
				if (!isTableCellNode(tableCell)) {
					throw new Error('Expected table cell');
				}

				tableCell.toggleHeaderStyle(TableCellHeaderStates.ROW);
			});
		});
	};

	const updateToolbar = () => {
		editor.read(() => {
			if (!isTableRowNode(selectedNode)) {
				return;
			}

			const lastDescendant = selectedNode.getLastDescendant();

			if (!lastDescendant) {
				return;
			}

			const tableCellNode = lastDescendant.getParents().find((n) => isTableCellNode(n));

			if (!tableCellNode) {
				return;
			}

			const style = tableCellNode.getHeaderStyles();

			if ([TableCellHeaderStates.ROW, TableCellHeaderStates.BOTH].includes(style)) {
				isRowHeader = true;
			} else {
				isRowHeader = false;
			}
		});
	};

	onMount(() => {
		updateToolbar();

		return mergeRegister(
			editor.registerUpdateListener(() => {
				updateToolbar();
			})
		);
	});
</script>

<div class="flex flex-col gap-2">
	<div
		class="forsen-wiki-theme-border flex items-center rounded-sm border bg-violet-900/25 text-sm text-white"
	>
		<Button
			on:click={() => onClickAddRow(false)}
			class="max-w-8! min-w-8! rounded-r-none! p-0!"
			title="Add before current row"
		>
			<ArrowUpIcon size="20" />
		</Button>

		<Button
			on:click={() => onClickAddRow()}
			class="max-w-8! min-w-8! rounded-none! p-0!"
			title="Add after current row"
		>
			<ArrowDownIcon size="20" />
		</Button>

		<div class="flex grow items-center gap-2 p-2" title="Add row">
			<PlusIcon size="16" /> <span>Add row</span>
		</div>
	</div>

	<div
		class="forsen-wiki-theme-border flex items-center rounded-sm border bg-violet-900/25 text-sm text-white"
	>
		<EditorButton
			on:click={toggleTableRowIsHeader}
			isActive={isRowHeader}
			title="Toggle header"
			class="rounded-r-none!"
		>
			<Rows3Icon />
		</EditorButton>

		<div class="flex grow items-center gap-2 p-2" title="Toggle header">
			<span>Toggle header</span>
		</div>
	</div>
</div>
