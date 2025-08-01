<script>
	// Based on umaranis' svelte-lexical
	import './table.css';

	import { onMount } from 'svelte';
	import { getEditor } from 'svelte-lexical';
	import {
		$createParagraphNode as createParagraphNode,
		$getNodeByKey as getNodeByKey,
		$isTextNode as isTextNode,
		COMMAND_PRIORITY_EDITOR,
	} from 'lexical';
	import {
		$computeTableMap as computeTableMap,
		$computeTableMapSkipCellCheck as computeTableMapSkipCellCheck,
		$createTableCellNode as createTableCellNode,
		$createTableNodeWithDimensions as createTableNodeWithDimensions,
		$getNodeTriplet as getNodeTriplet,
		$isTableCellNode as isTableCellNode,
		$isTableNode as isTableNode,
		$isTableRowNode as isTableRowNode,
		applyTableHandlers,
		INSERT_TABLE_COMMAND,
		TableCellNode,
		TableNode,
		TableRowNode,
	} from '@lexical/table';
	import {
		$insertFirst as insertFirst,
		$insertNodeToNearestRoot as insertNodeToNearestRoot,
		mergeRegister,
	} from '@lexical/utils';

	import { modal } from '$lib/stores/modal';
	import InsertTableDialog from '$lib/components/editor/toolbar/TableButtons/InsertTableDialog.svelte';

	/**
	 * @typedef Props
	 * @property {boolean} [hasCellMerge]
	 * @property {boolean} [hasCellBackgroundColor]
	 * @property {boolean} [hasTabHandler]
	 */

	/** @type {Props} */
	let { hasCellMerge = false, hasCellBackgroundColor = false, hasTabHandler = false } = $props();

	/**
	 * @typedef {import('lexical').NodeKey} NodeKey
	 * @typedef {import('lexical').LexicalEditor} LexicalEditor
	 *
	 * @typedef {import('@lexical/table').HTMLTableElementWithWithTableSelectionState} HTMLTableElementWithWithTableSelectionState
	 * @typedef {import('@lexical/table').TableObserver} TableObserver
	 * @typedef {import('@lexical/table').InsertTableCommandPayloadHeaders} InsertTableCommandPayloadHeaders
	 */

	/** @type {LexicalEditor} */
	const editor = getEditor();

	function setupTableSelections() {
		/** @type {Map<NodeKey, [TableObserver, HTMLTableElementWithWithTableSelectionState]>}*/
		const tableSelections = new Map();

		/**
		 * @param {TableNode} tableNode
		 * @param {NodeKey} nodeKey
		 *
		 * @param {HTMLElement} dom
		 */
		const initializeTableNode = (tableNode, nodeKey, dom) => {
			const tableElement = /** @type {HTMLTableElementWithWithTableSelectionState} */ (dom);
			const tableSelection = applyTableHandlers(tableNode, tableElement, editor, hasTabHandler);
			tableSelections.set(nodeKey, [tableSelection, tableElement]);
		};

		const unregisterMutationListener = editor.registerMutationListener(
			TableNode,
			(nodeMutations) => {
				for (const [nodeKey, mutation] of nodeMutations) {
					if (mutation === 'created' || mutation === 'updated') {
						const tableSelection = tableSelections.get(nodeKey);
						const dom = editor.getElementByKey(nodeKey);
						if (!(tableSelection && dom === tableSelection[1])) {
							// The update created a new DOM node, destroy the existing TableObserver
							if (tableSelection) {
								tableSelection[0].removeListeners();
								tableSelections.delete(nodeKey);
							}
							if (dom !== null) {
								// Create a new TableObserver
								editor.getEditorState().read(() => {
									/** @type {TableNode?} */
									const tableNode = getNodeByKey(nodeKey);
									if (isTableNode(tableNode)) {
										initializeTableNode(tableNode, nodeKey, dom);
									}
								});
							}
						}
					} else if (mutation === 'destroyed') {
						const tableSelection = tableSelections.get(nodeKey);
						if (tableSelection !== undefined) {
							tableSelection[0].removeListeners();
							tableSelections.delete(nodeKey);
						}
					}
				}
			},
			{ skipInitialization: false }
		);

		return () => {
			unregisterMutationListener();
			// Hook might be called multiple times so cleaning up tables listeners as well,
			// as it'll be reinitialized during recurring call
			for (const [, [tableSelection]] of tableSelections) {
				tableSelection.removeListeners();
			}
		};
	}

	// Unmerge cells when the feature isn't enabled
	function unmergeCellsNodeTransform() {
		if (hasCellMerge) {
			return () => {
				// intentionally empty
			};
		}

		return editor.registerNodeTransform(TableCellNode, (node) => {
			if (node.getColSpan() > 1 || node.getRowSpan() > 1) {
				// When we have rowSpan we have to map the entire Table to understand where the new Cells
				// fit best; let's analyze all Cells at once to save us from further transform iterations
				const [, , gridNode] = getNodeTriplet(node);
				const [gridMap] = computeTableMap(gridNode, node, node);
				// TODO this function expects Tables to be normalized. Look into this once it exists
				const rowsCount = gridMap.length;
				const columnsCount = gridMap[0].length;
				let row = gridNode.getFirstChild();
				if (!isTableRowNode(row)) {
					throw new Error('Expected TableNode first child to be a RowNode');
				}
				const unmerged = [];
				for (let i = 0; i < rowsCount; i++) {
					if (i !== 0) {
						row = row.getNextSibling();
						if (!isTableRowNode(row)) {
							throw new Error('Expected TableNode first child to be a RowNode');
						}
					}
					/** @type {TableCellNode?} */
					let lastRowCell = null;
					for (let j = 0; j < columnsCount; j++) {
						const cellMap = gridMap[i][j];
						const cell = cellMap.cell;
						if (cellMap.startRow === i && cellMap.startColumn === j) {
							lastRowCell = cell;
							unmerged.push(cell);
						} else if (cell.getColSpan() > 1 || cell.getRowSpan() > 1) {
							if (!isTableCellNode(cell)) {
								throw new Error('Expected TableNode cell to be a TableCellNode');
							}
							const newCell = createTableCellNode(cell.__headerState);
							if (lastRowCell !== null) {
								lastRowCell.insertAfter(newCell);
							} else {
								insertFirst(row, newCell);
							}
						}
					}
				}
				for (const cell of unmerged) {
					cell.setColSpan(1);
					cell.setRowSpan(1);
				}
			}
		});
	}

	// Remove cell background color when feature is disabled
	function removeCellColorNodeTransform() {
		if (hasCellBackgroundColor) {
			return () => {
				// intentionally empty
			};
		}
		return editor.registerNodeTransform(TableCellNode, (node) => {
			if (node.getBackgroundColor() !== null) {
				node.setBackgroundColor(null);
			}
		});
	}

	/** @param {{ columns: string, rows: string, includeHeaders?: InsertTableCommandPayloadHeaders }} payload */
	function wrapperInsertTable(payload) {
		modal.set({
			component: InsertTableDialog,
			columns: payload.columns,
			rows: payload.rows,
			includeHeaders: payload.includeHeaders,
			/** @param {{ columns: string, rows: string, includeHeaders: InsertTableCommandPayloadHeaders }} data */
			onSubmit: (data) => {
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

	onMount(() => {
		if (!editor.hasNodes([TableNode, TableCellNode, TableRowNode])) {
			throw new Error(
				'TablePlugin: TableNode, TableCellNode or TableRowNode not registered on editor'
			);
		}

		const unregisterTableInsertCmd = editor.registerCommand(
			INSERT_TABLE_COMMAND,
			({ columns, rows, includeHeaders }) => {
				wrapperInsertTable({ columns, rows, includeHeaders });

				return true;
			},
			COMMAND_PRIORITY_EDITOR
		);

		const unregisterMutationListener = editor.registerNodeTransform(TableNode, (node) => {
			const [gridMap] = computeTableMapSkipCellCheck(node, null, null);
			const maxRowLength = gridMap.reduce((curLength, row) => {
				return Math.max(curLength, row.length);
			}, 0);
			const rowNodes = node.getChildren();

			for (let i = 0; i < gridMap.length; ++i) {
				const rowNode = /** @type {TableRowNode?} */ (rowNodes[i]);

				if (!rowNode) {
					continue;
				}

				const rowLength = gridMap[i].reduce((acc, cell) => (cell ? 1 + acc : acc), 0);

				if (rowLength === maxRowLength) {
					continue;
				}

				for (let j = rowLength; j < maxRowLength; ++j) {
					// TODO: inherit header state from another header or body
					const newCell = createTableCellNode(0);
					newCell.append(createParagraphNode());
					rowNode.append(newCell);
				}
			}
		});

		const unregisterUnmergeCellsNodeTransform = unmergeCellsNodeTransform();

		const unregisterRemoveCellColorNodeTransform = removeCellColorNodeTransform();

		const unregisterTableSelections = setupTableSelections();

		return mergeRegister(
			unregisterTableInsertCmd,
			unregisterMutationListener,
			unregisterTableSelections,
			unregisterUnmergeCellsNodeTransform,
			unregisterRemoveCellColorNodeTransform
		);
	});
</script>
