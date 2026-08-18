<script>
	// Based on umaranis' svelte-lexical

	import { onMount } from 'svelte';
	import { PlusIcon, ArrowLeftIcon, ArrowRightIcon, Columns3Icon } from '@lucide/svelte';
	import {
		$createNodeSelection as createNodeSelection,
		$setSelection as setSelection,
		mergeRegister,
	} from 'lexical';
	import {
		$insertTableColumnAtSelection as insertTableColumnAtSelection,
		$getTableNodeFromLexicalNodeOrThrow as getTableNodeFromLexicalNodeOrThrow,
		$getTableColumnIndexFromTableCellNode as getTableColumnIndexFromTableCellNode,
		$isTableRowNode as isTableRowNode,
		$isTableCellNode as isTableCellNode,
		TableCellHeaderStates,
	} from '@lexical/table';
	import { getEditor } from 'svelte-lexical';

	import Button from '$lib/components/Button.svelte';
	import EditorButton from '../../EditorButton.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {import('$lib/lexical/custom').ATableNode} selectedTable
	 * @property {import('$lib/lexical/custom').ATableCellNode} selectedCell
	 */

	/** @type {Props} */
	let { selectedTable, selectedCell } = $props();

	let isColumnHeader = $state(false);

	const editor = getEditor();

	/** @param {boolean} [insertAfter] */
	const onClickAddColumn = (insertAfter) => {
		editor.update(() => {
			if (!selectedTable) {
				return;
			}

			selectedCell.selectEnd();

			insertTableColumnAtSelection(insertAfter);

			const selection = createNodeSelection();
			selection.add(selectedCell.getKey());
			setSelection(selection);
		});
	};

	const toggleTableColumnIsHeader = () => {
		editor.update(() => {
			const tableNode = getTableNodeFromLexicalNodeOrThrow(selectedCell);

			const tableColumnIndex = getTableColumnIndexFromTableCellNode(selectedCell);

			/** @type {import('@lexical/table').TableRowNode[]} */
			const tableRows = tableNode.getChildren();
			const maxRowsLength = Math.max(...tableRows.map((row) => row.getChildren().length));

			if (tableColumnIndex >= maxRowsLength || tableColumnIndex < 0) {
				throw new Error('Expected table cell to be inside of table row.');
			}

			for (let r = 0; r < tableRows.length; r++) {
				const tableRow = tableRows[r];

				if (!isTableRowNode(tableRow)) {
					throw new Error('Expected table row');
				}

				const tableCells = tableRow.getChildren();
				if (tableColumnIndex >= tableCells.length) {
					// if cell is outside of bounds for the current row (for example various merge cell cases) we shouldn't highlight it
					continue;
				}

				const tableCell = tableCells[tableColumnIndex];

				if (!isTableCellNode(tableCell)) {
					throw new Error('Expected table cell');
				}

				tableCell.toggleHeaderStyle(TableCellHeaderStates.COLUMN);
			}
		});
	};

	const updateToolbar = () => {
		editor.read(() => {
			if (!isTableCellNode(selectedCell)) {
				return;
			}

			if (!selectedCell.isAttached()) {
				return;
			}

			const style = selectedCell.getHeaderStyles();

			if ([TableCellHeaderStates.COLUMN, TableCellHeaderStates.BOTH].includes(style)) {
				isColumnHeader = true;
			} else {
				isColumnHeader = false;
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
			on:click={() => onClickAddColumn(false)}
			class="max-w-8! min-w-8! rounded-none! p-0!"
			title="Add to the left of current column"
		>
			<ArrowLeftIcon size="20" />
		</Button>

		<Button
			on:click={() => onClickAddColumn()}
			class="max-w-8! min-w-8! rounded-none! p-0!"
			title="Add to the right of current column"
		>
			<ArrowRightIcon size="20" />
		</Button>

		<div class="flex grow items-center gap-2 p-2" title="Add column">
			<PlusIcon size="16" /> <span>Add column</span>
		</div>
	</div>
	<div
		class="forsen-wiki-theme-border flex items-center rounded-sm border bg-violet-900/25 text-sm text-white"
	>
		<EditorButton
			on:click={toggleTableColumnIsHeader}
			isActive={isColumnHeader}
			title="Toggle header"
		>
			<Columns3Icon />
		</EditorButton>
		<div class="flex grow items-center gap-2 p-2" title="Toggle header">
			<span>Toggle header</span>
		</div>
	</div>
</div>
