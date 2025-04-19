<script>
	// Based on umaranis' svelte-lexical

	import { onMount } from 'svelte';
	import { PlusIcon, MinusIcon, ArrowLeftIcon, ArrowRightIcon, Columns3Icon } from 'lucide-svelte';
	import { $isRangeSelection as isRangeSelection, $getSelection as getSelection } from 'lexical';
	import { getEditor } from 'svelte-lexical';
	import { mergeRegister } from '@lexical/utils';
	import {
		$insertTableColumn__EXPERIMENTAL as insertTableColumn__EXPERIMENTAL,
		$deleteTableColumn__EXPERIMENTAL as deleteTableColumn__EXPERIMENTAL,
		$getTableNodeFromLexicalNodeOrThrow as getTableNodeFromLexicalNodeOrThrow,
		$getTableColumnIndexFromTableCellNode as getTableColumnIndexFromTableCellNode,
		$isTableRowNode as isTableRowNode,
		$isTableCellNode as isTableCellNode,
		TableCellHeaderStates,
	} from '@lexical/table';

	import Button from '$lib/components/Button.svelte';
	import EditorButton from '../EditorButton.svelte';

	/** @type {import("@lexical/table").TableNode | null} */
	export let selectedTable = null;

	$: isColumnHeader = false;

	const editor = getEditor();

	/** @param {boolean} [insertAfter] */
	const onClickAddColumn = (insertAfter) => {
		editor.update(() => {
			if (!selectedTable) {
				return;
			}

			insertTableColumn__EXPERIMENTAL(insertAfter);
		});
	};

	const onClickRemoveColumn = () => {
		editor.update(() => {
			if (!selectedTable) {
				return;
			}

			deleteTableColumn__EXPERIMENTAL();
		});
	};

	const toggleTableColumnIsHeader = () => {
		editor.update(() => {
			const selection = getSelection();

			if (!selection) {
				return;
			}

			const [node] = selection.getNodes();

			const tableCellNode = node.getParents().find((n) => isTableCellNode(n));

			if (!tableCellNode) {
				return;
			}

			const tableNode = getTableNodeFromLexicalNodeOrThrow(tableCellNode);

			const tableColumnIndex = getTableColumnIndexFromTableCellNode(tableCellNode);

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
			const selection = getSelection();

			if (!isRangeSelection(selection)) {
				return;
			}

			const [node] = selection.getNodes();

			const closestCell = node.getParents().find((n) => isTableCellNode(n));

			if (!closestCell) {
				return;
			}

			const style = closestCell.getHeaderStyles();

			if ([TableCellHeaderStates.COLUMN, TableCellHeaderStates.BOTH].includes(style)) {
				isColumnHeader = true;
			} else {
				isColumnHeader = false;
			}
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

<div class="forsen-wiki-theme-outline flex items-center gap-2 outline-offset-8">
	<div class="flex select-none flex-col items-center justify-center font-mono text-xs leading-none">
		<span>C</span>
		<span>O</span>
		<span>L</span>
	</div>

	<div
		class="forsen-wiki-theme-border flex rounded border bg-violet-900 text-sm text-white dark:bg-opacity-50"
	>
		<div class="flex items-center gap-2 p-2" title="Add column">
			<PlusIcon size="16" />
		</div>

		<Button
			on:click={() => onClickAddColumn(false)}
			class="!min-w-8 !max-w-8 !rounded-none !p-0"
			title="Add to the left of current column"
		>
			<ArrowLeftIcon size="20" />
		</Button>

		<Button
			on:click={() => onClickAddColumn()}
			class="!min-w-8 !max-w-8 !rounded-l-none !p-0"
			title="Add to the right of current column"
		>
			<ArrowRightIcon size="20" />
		</Button>
	</div>

	<Button on:click={onClickRemoveColumn} class="!p-0" title="Remove column">
		<MinusIcon size="20" />
	</Button>

	<EditorButton
		on:click={toggleTableColumnIsHeader}
		isActive={isColumnHeader}
		title="Toggle header"
	>
		<Columns3Icon />
	</EditorButton>
</div>
