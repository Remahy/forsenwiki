<script lang="ts">
	// Based on umaranis' svelte-lexical
	import { onMount } from 'svelte';
	import {
		$createParagraphNode as createParagraphNode,
		$isTextNode as isTextNode,
		$createTextNode as createTextNode,
		$getSelection as getSelection,
		COMMAND_PRIORITY_NORMAL,
		KEY_ARROW_LEFT_COMMAND,
		KEY_ARROW_RIGHT_COMMAND,
		mergeRegister,
		type PointType,
		COMMAND_PRIORITY_CRITICAL,
	} from 'lexical';
	import { $insertNodeToNearestRoot as insertNodeToNearestRoot } from '@lexical/utils';
	import {
		INSERT_TABLE_COMMAND,
		registerTableCellUnmergeTransform,
		registerTablePlugin,
		registerTableSelectionObserver,
		setScrollableTablesActive,
		TableCellNode,
		$createTableNodeWithDimensions as createTableNodeWithDimensions,
		$getTableCellNodeFromLexicalNode as getTableCellNodeFromLexicalNode,
		$isTableCellNode as isTableCellNode,
		$computeTableMap as computeTableMap,
		$getTableNodeFromLexicalNodeOrThrow as getTableNodeFromLexicalNodeOrThrow,
		$getTableRowNodeFromTableCellNodeOrThrow as getTableRowNodeFromTableCellNodeOrThrow,
		type InsertTableCommandPayloadHeaders,
	} from '@lexical/table';
	import { getEditor } from 'svelte-lexical';

	import { modal } from '$lib/stores/modal';
	import InsertTableDialog from '$lib/components/editor/toolbar/TableButtons/InsertTableDialog.svelte';
	import { $isATableNode as isATableNode } from './ATableNode';
	import {
		hasAdjacentNode,
		insertFnc,
		offsetIsAtEdges,
	} from '$lib/components/editor/utils/insertUtils';

	function wrapperInsertTable(payload: {
		columns: string;
		rows: string;
		includeHeaders?: InsertTableCommandPayloadHeaders;
	}) {
		modal.set({
			component: InsertTableDialog,
			columns: payload.columns,
			rows: payload.rows,
			includeHeaders: payload.includeHeaders,
			onSubmit: (data: {
				columns: string;
				rows: string;
				includeHeaders: InsertTableCommandPayloadHeaders;
			}) => {
				editor.update(() => {
					const tableNode = createTableNodeWithDimensions(
						Number(data.rows),
						Number(data.columns),
						data.includeHeaders
					);

					insertNodeToNearestRoot(tableNode);

					const firstDescendant = tableNode.getFirstDescendant();

					if (isTextNode(firstDescendant)) {
						firstDescendant.select();
					}
				});
			},
			isOpen: true,
		});
	}

	export interface TablePluginProps {
		/**
		 * When `false` (default `true`), merged cell support (colspan and rowspan) will be disabled and all
		 * tables will be forced into a regular grid with 1x1 table cells.
		 */
		hasCellMerge?: boolean;
		/**
		 * When `false` (default `true`), the background color of TableCellNode will always be removed.
		 */
		hasCellBackgroundColor?: boolean;
		/**
		 * When `true` (default `true`), the tab key can be used to navigate table cells.
		 */
		hasTabHandler?: boolean;
		/**
		 * When `true` (default `false`), tables will be wrapped in a `<div>` to enable horizontal scrolling
		 */
		hasHorizontalScroll?: boolean;
	}

	/**
	 * A plugin to enable all of the features of Lexical's TableNode.
	 * @param props - See type for documentation
	 * @returns An element to render in your LexicalComposer
	 */
	let {
		hasCellMerge = false,
		hasCellBackgroundColor = false,
		hasTabHandler = true,
		hasHorizontalScroll = false,
	}: TablePluginProps = $props();

	const editor = getEditor();

	const INSERT_BEFORE = true;
	const INSERT_AFTER = false;

	const insertParagraph = (atBefore = INSERT_BEFORE) => {
		return editor.read(() => {
			const selection = getSelection();
			if (!selection?.isCollapsed()) {
				return false;
			}

			const [anchor] = selection.getStartEndPoints() as [PointType, PointType];
			const anchorNode = anchor.getNode();

			const cellNode =
				anchorNode.getParents().find((n) => isTableCellNode(n)) ||
				(isTableCellNode(anchorNode) && anchorNode);

			if (!cellNode) {
				return false;
			}

			const aTableNodeParent = anchorNode.getParents().find((n) => isATableNode(n));

			if (!aTableNodeParent) {
				return false;
			}

			const row = getTableRowNodeFromTableCellNodeOrThrow(cellNode);
			const table = getTableNodeFromLexicalNodeOrThrow(cellNode);

			const tableMap = computeTableMap(table, cellNode, cellNode);

			const rows = tableMap.length;
			const cols = tableMap[0].length;
			const rowIndex = row.getIndexWithinParent();
			const colIndex = cellNode.getIndexWithinParent();

			const isLastCell = rowIndex === rows - 1 && colIndex === cols - 1;
			const isFirstCell = rowIndex === 0 && colIndex === 0;

			if (!isLastCell && !isFirstCell) {
				return false;
			}

			const isAtEdge = offsetIsAtEdges(atBefore, anchor.offset, cellNode.getTextContentSize());
			const adjacentNode = hasAdjacentNode(atBefore, aTableNodeParent);

			if (!isAtEdge || adjacentNode) {
				return false;
			}

			editor.update(() => {
				const newNode = createParagraphNode().append(createTextNode());
				const n = insertFnc(atBefore, aTableNodeParent, newNode);

				n.selectStart();
			});

			return true;
		});
	};

	$effect(() => {
		setScrollableTablesActive(editor, hasHorizontalScroll);
	});

	$effect(() => registerTablePlugin(editor));

	$effect(() => registerTableSelectionObserver(editor, hasTabHandler));

	// Unmerge cells when the feature isn't enabled
	$effect(() => {
		if (!hasCellMerge) {
			return registerTableCellUnmergeTransform(editor);
		}
	});

	// Remove cell background color when feature is disabled
	$effect(() => {
		if (hasCellBackgroundColor) {
			return;
		}
		return editor.registerNodeTransform(TableCellNode, (node) => {
			if (node.getBackgroundColor() !== null) {
				node.setBackgroundColor(null);
			}
		});
	});

	onMount(() => {
		return mergeRegister(
			editor.registerCommand(
				INSERT_TABLE_COMMAND,
				({ columns, rows, includeHeaders }) => {
					wrapperInsertTable({ columns, rows, includeHeaders });

					return true;
				},
				COMMAND_PRIORITY_NORMAL
			),
			editor.registerCommand(
				KEY_ARROW_LEFT_COMMAND,
				(payload) => {
					if (payload.ctrlKey) {
						return false;
					}

					return insertParagraph(INSERT_BEFORE);
				},
				COMMAND_PRIORITY_CRITICAL
			),
			editor.registerCommand(
				KEY_ARROW_RIGHT_COMMAND,
				(payload) => {
					if (payload.ctrlKey) {
						return false;
					}

					return insertParagraph(INSERT_AFTER);
				},
				COMMAND_PRIORITY_CRITICAL
			)
		);
	});
</script>
