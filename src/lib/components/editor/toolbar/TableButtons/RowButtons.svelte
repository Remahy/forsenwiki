<script>
	// Based on umaranis' svelte-lexical

	import { onMount } from 'svelte';
	import { PlusIcon, MinusIcon, ArrowUpIcon, ArrowDownIcon, Rows3Icon } from 'lucide-svelte';
	import {
		$isRangeSelection as isRangeSelection,
		$getSelection as getSelection,
		COMMAND_PRIORITY_CRITICAL,
		SELECTION_CHANGE_COMMAND,
	} from 'lexical';
	import {
		$insertTableRow__EXPERIMENTAL as insertTableRow__EXPERIMENTAL,
		$deleteTableRow__EXPERIMENTAL as deleteTableRow__EXPERIMENTAL,
		$getTableNodeFromLexicalNodeOrThrow as getTableNodeFromLexicalNodeOrThrow,
		$getTableRowIndexFromTableCellNode as getTableRowIndexFromTableCellNode,
		$isTableRowNode as isTableRowNode,
		$isTableCellNode as isTableCellNode,
		TableCellHeaderStates,
	} from '@lexical/table';
	import { getEditor } from 'svelte-lexical';

	import Button from '$lib/components/Button.svelte';
	import EditorButton from '../EditorButton.svelte';

	/** @type {import("@lexical/table").TableNode | null} */
	export let selectedTable = null;

	$: isRowHeader = false;

	const editor = getEditor();

	/** @param {boolean} [insertAfter] */
	const onClickAddRow = (insertAfter) => {
		editor.update(() => {
			if (!selectedTable) {
				return;
			}

			insertTableRow__EXPERIMENTAL(insertAfter);
		});
	};

	const onClickRemoveRow = () => {
		editor.update(() => {
			if (!selectedTable) {
				return;
			}

			deleteTableRow__EXPERIMENTAL();
		});
	};

	const toggleTableRowIsHeader = () => {
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

			const tableRowIndex = getTableRowIndexFromTableCellNode(tableCellNode);

			const tableRows = tableNode.getChildren();

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
		const selection = getSelection();

		if (!isRangeSelection(selection)) {
			return;
		}

		const [node] = selection.getNodes();

		const closestCell = node.getParents().find((n) => isTableCellNode(n));

		if (!closestCell) {
			return;
		}

		const style = closestCell.getHeaderStyles()

		if (style === TableCellHeaderStates.ROW) {
			isRowHeader = true;
		} else {
			isRowHeader = false;
		}
	};

	onMount(() => {
		const cleanup = editor.registerCommand(
			SELECTION_CHANGE_COMMAND,
			() => {
				updateToolbar();
				return false;
			},
			COMMAND_PRIORITY_CRITICAL
		);

		return () => {
			cleanup();
		};
	});
</script>

<div class="forsen-wiki-theme-outline mx-2 flex items-center gap-2 outline-offset-8">
	<div class="flex select-none flex-col items-center justify-center font-mono text-xs leading-none">
		<span>R</span>
		<span>O</span>
		<span>W</span>
	</div>

	<div
		class="forsen-wiki-theme-border flex items-center rounded border bg-violet-900 text-sm text-white dark:bg-opacity-50"
	>
		<div class="flex items-center gap-2 p-2" title="Add row">
			<PlusIcon size="16" />
		</div>

		<Button
			on:click={() => onClickAddRow(false)}
			class="!min-w-8 !max-w-8 !rounded-none !p-0"
			title="Add before current row"
		>
			<ArrowUpIcon size="20" />
		</Button>

		<Button
			on:click={() => onClickAddRow()}
			class="!min-w-8 !max-w-8 !rounded-l-none !p-0"
			title="Add after current row"
		>
			<ArrowDownIcon size="20" />
		</Button>
	</div>

	<Button on:click={onClickRemoveRow} class="!p-0" title="Remove row">
		<MinusIcon size="20" />
	</Button>

	<EditorButton on:click={toggleTableRowIsHeader} isActive={isRowHeader} title="Toggle header">
		<Rows3Icon />
	</EditorButton>
</div>
