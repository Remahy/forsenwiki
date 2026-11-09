import './EditorTable.css';

import {
	$createParagraphNode,
	$createTextNode,
	$getSelection,
	$isTextNode,
	COMMAND_PRIORITY_CRITICAL,
	COMMAND_PRIORITY_NORMAL,
	KEY_ARROW_LEFT_COMMAND,
	KEY_ARROW_RIGHT_COMMAND,
} from 'lexical';
import { defineExtension } from '@lexical/extension';
import { $insertNodeToNearestRoot, mergeRegister } from '@lexical/utils';
import {
	$computeTableMap,
	$createTableNodeWithDimensions,
	$getTableCellNodeFromLexicalNode,
	$getTableNodeFromLexicalNodeOrThrow,
	$getTableRowNodeFromTableCellNodeOrThrow,
	$isTableCellNode,
	INSERT_TABLE_COMMAND,
	TableExtension,
} from '@lexical/table';

import { modal } from '$lib/stores/modal';
import InsertTableDialog from '$lib/components/editor/toolbar/Table/InsertTableDialog.svelte';
import {
	hasAdjacentNode,
	insertFnc,
	offsetIsAtEdges,
} from '$lib/components/editor/utils/insertUtils';
import { restoreEditorFocus } from '$lib/components/editor/utils/focusEditor';
import { $isATableNode } from './ATableNode';

/**
 * @typedef {import('lexical').PointType} PointType
 * @typedef {import('@lexical/table').InsertTableCommandPayloadHeaders} InsertTableCommandPayloadHeaders
 * @typedef {{ columns: string, rows: string, includeHeaders?: InsertTableCommandPayloadHeaders }} InsertTablePayload
 */

const INSERT_BEFORE = true;
const INSERT_AFTER = false;

/**
 * @param {LexicalEditor} editor
 * @param {InsertTablePayload} payload
 */
const openInsertTableModal = (editor, { columns, rows, includeHeaders }) => {
	modal.set({
		isOpen: true,
		component: InsertTableDialog,
		columns,
		rows,
		includeHeaders,
		onClose: () => restoreEditorFocus(editor),
		/** @param {{ columns: string, rows: string, includeHeaders: InsertTableCommandPayloadHeaders }} data */
		onSubmit: (data) => {
			editor.update(() => {
				const tableNode = $createTableNodeWithDimensions(
					Number(data.rows),
					Number(data.columns),
					data.includeHeaders
				);

				$insertNodeToNearestRoot(tableNode);

				const firstDescendant = tableNode.getFirstDescendant();

				if ($isTextNode(firstDescendant)) {
					firstDescendant.select();
				}
			});
		},
	});
};

/**
 * Runs inside the KEY_ARROW command, which is already an editor update.
 * @param {boolean} atBefore
 */
const $insertParagraphAtTableEdge = (atBefore) => {
	const selection = $getSelection();
	if (!selection?.isCollapsed()) {
		return false;
	}

	const [anchor] = /** @type {[PointType, PointType]} */ (selection.getStartEndPoints());
	const anchorNode = anchor.getNode();

	const cellNode =
		anchorNode.getParents().find((n) => $isTableCellNode(n)) ||
		($isTableCellNode(anchorNode) && anchorNode);

	if (!cellNode) {
		return false;
	}

	const aTableNodeParent = anchorNode.getParents().find((n) => $isATableNode(n));

	if (!aTableNodeParent) {
		return false;
	}

	const cell = $getTableCellNodeFromLexicalNode(cellNode);

	if (!cell) {
		return false;
	}

	const row = $getTableRowNodeFromTableCellNodeOrThrow(cell);
	const table = $getTableNodeFromLexicalNodeOrThrow(cell);

	const [tableMap] = $computeTableMap(table, cell, cell);

	const rows = tableMap.length;
	const cols = tableMap[0].length;
	const rowIndex = row.getIndexWithinParent();
	const colIndex = cell.getIndexWithinParent();

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

	const newNode = $createParagraphNode().append($createTextNode());
	insertFnc(atBefore, aTableNodeParent, newNode).selectStart();

	return true;
};

/** @param {KeyboardEvent} event @param {boolean} atBefore */
const onArrow = (event, atBefore) =>
	event.ctrlKey ? false : $insertParagraphAtTableEdge(atBefore);

export const ATableExtension = defineExtension({
	name: 'article/table',
	dependencies: [TableExtension],
	register: (editor) =>
		mergeRegister(
			editor.registerCommand(
				INSERT_TABLE_COMMAND,
				(payload) => {
					openInsertTableModal(editor, payload);
					return true;
				},
				COMMAND_PRIORITY_NORMAL
			),
			editor.registerCommand(
				KEY_ARROW_LEFT_COMMAND,
				(event) => onArrow(event, INSERT_BEFORE),
				COMMAND_PRIORITY_CRITICAL
			),
			editor.registerCommand(
				KEY_ARROW_RIGHT_COMMAND,
				(event) => onArrow(event, INSERT_AFTER),
				COMMAND_PRIORITY_CRITICAL
			)
		),
});
