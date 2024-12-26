<script>
	// Based on umaranis' svelte-lexical

	import { PlusIcon } from 'lucide-svelte';
	import { getEditor } from 'svelte-lexical';
	import { onDestroy, onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { $getNearestNodeFromDOMNode as getNearestNodeFromDOMNode } from 'lexical';
	import {
		$getTableColumnIndexFromTableCellNode as getTableColumnIndexFromTableCellNode,
		$getTableRowIndexFromTableCellNode as getTableRowIndexFromTableCellNode,
		$insertTableColumn__EXPERIMENTAL as insertTableColumn__EXPERIMENTAL,
		$insertTableRow__EXPERIMENTAL as insertTableRow__EXPERIMENTAL,
		$isTableCellNode as isTableCellNode,
		$isTableNode as isTableNode,
		TableCellNode,
		TableNode,
		TableRowNode,
	} from '@lexical/table';
	import { $findMatchingParent as findMatchingParent, mergeRegister } from '@lexical/utils';

	import { CAN_USE_DOM } from '$lib/environment/utils';
	import { useDebounce } from '$lib/utils/debouncer';
	import Button from '$lib/components/Button.svelte';

	/**
	 * @typedef {import('lexical').NodeKey} NodeKey
	 */

	const BUTTON_WIDTH_PX = 20;

	const editor = getEditor();
	let isShownRow = writable(false);
	let isShownColumn = writable(false);
	let shouldListenMouseMove = false;
	let position = writable('');

	/** @type {Set<NodeKey>} */
	const codeSetRef = new Set();

	/** @type {HTMLElement | null} */
	let tableDOMNodeRef = null;

	/** @type {HTMLElement | undefined} */
	export let anchorElem;

	/**
	 * @param {MouseEvent} event
	 * @returns {{ tableDOMNode: HTMLElement | null, isOutside: boolean }}
	 */
	function getMouseInfo(event) {
		const target = event.target;

		if (target && target instanceof HTMLElement) {
			const tableDOMNode = /** @type {HTMLElement} */ (
				target.closest('td.tableCell, th.tableCell')
			);

			const isOutside = !(
				tableDOMNode ||
				target.closest('button.tableAddRows') ||
				target.closest('button.tableAddColumns') ||
				target.closest('div.tableCellResizer')
			);

			return { isOutside, tableDOMNode };
		} else {
			return { isOutside: true, tableDOMNode: null };
		}
	}


	const debouncedOnMouseMove = /** @type {any} */ (useDebounce(
		/** @param {MouseEvent} event */
		(event) => {
			const { isOutside, tableDOMNode } = getMouseInfo(event);

			if (isOutside) {
				$isShownRow = false;
				$isShownColumn = false;
				return;
			}

			if (!tableDOMNode) {
				return;
			}

			tableDOMNodeRef = tableDOMNode;

			/** @type {TableCellNode | null} */
			let hoveredRowNode = null;

			/** @type {TableCellNode | null} */
			let hoveredColumnNode = null;

			/** @type {HTMLElement | null} */
			let tableDOMElement = null;

			editor.update(() => {
				const maybeTableCell = getNearestNodeFromDOMNode(tableDOMNode);

				if (isTableCellNode(maybeTableCell)) {
					const table = findMatchingParent(maybeTableCell, (node) => isTableNode(node));
					if (!isTableNode(table)) {
						return;
					}

					tableDOMElement = editor.getElementByKey(table?.getKey());

					if (tableDOMElement) {
						const rowCount = table.getChildrenSize();
						const colCount = /** @type {TableRowNode} */ (
							/** @type {TableNode} */ (table).getChildAtIndex(0)
						)?.getChildrenSize();

						const rowIndex = getTableRowIndexFromTableCellNode(maybeTableCell);
						const colIndex = getTableColumnIndexFromTableCellNode(maybeTableCell);

						if (rowIndex === rowCount - 1) {
							hoveredRowNode = maybeTableCell;
						} else if (colIndex === colCount - 1) {
							hoveredColumnNode = maybeTableCell;
						}
					}
				}
			});

			if (tableDOMElement) {
				const {
					width: tableElemWidth,
					y: tableElemY,
					x: tableElemX,
					right: tableElemRight,
					bottom: tableElemBottom,
					height: tableElemHeight,
				} = /** @type {HTMLTableElement} */ (tableDOMElement).getBoundingClientRect();

				if (!anchorElem) {
					return;
				}

				const { x: editorElemX, y: editorElemY } = anchorElem.getBoundingClientRect();

				if (hoveredRowNode) {
					$isShownColumn = false;
					$isShownRow = true;
					$position = `left: ${tableElemX - editorElemX}px; top: ${tableElemBottom - editorElemY + 5}px; width: ${tableElemWidth}px;`;
				} else if (hoveredColumnNode) {
					$isShownColumn = true;
					$isShownRow = false;
					$position = `height: ${tableElemHeight}px; left: ${tableElemRight - editorElemX + 5}px; top: ${tableElemY - editorElemY}px;`;
				}
			}
		},
		50,
		250
	));

	$: if (CAN_USE_DOM && shouldListenMouseMove) {
		document.addEventListener('mousemove', debouncedOnMouseMove);
	} else if (CAN_USE_DOM) {
		$isShownRow = false;
		$isShownColumn = false;
		debouncedOnMouseMove.cancel();
		document.removeEventListener('mousemove', debouncedOnMouseMove);
	}

	onDestroy(() => {
		$isShownRow = false;
		$isShownColumn = false;
		debouncedOnMouseMove.cancel();

		if (CAN_USE_DOM) {
			document.removeEventListener('mousemove', debouncedOnMouseMove);
		}
	});

	onMount(() => {
		return mergeRegister(
			editor.registerMutationListener(
				TableNode,
				(mutations) => {
					editor.getEditorState().read(() => {
						for (const [key, type] of mutations) {
							switch (type) {
								case 'created':
									codeSetRef.add(key);
									shouldListenMouseMove = codeSetRef.size > 0;
									break;

								case 'destroyed':
									codeSetRef.delete(key);
									shouldListenMouseMove = codeSetRef.size > 0;
									break;

								default:
									break;
							}
						}
					});
				},
				{ skipInitialization: false }
			)
		);
	});

	/** @param {boolean} insertRow */
	const insertAction = (insertRow) => {
		editor.update(() => {
			if (tableDOMNodeRef) {
				const maybeTableNode = getNearestNodeFromDOMNode(tableDOMNodeRef);
				maybeTableNode?.selectEnd();
				if (insertRow) {
					insertTableRow__EXPERIMENTAL();
					$isShownRow = false;
				} else {
					insertTableColumn__EXPERIMENTAL();
					$isShownColumn = false;
				}
			}
		});
	};
</script>

{#if $isShownRow}
	<Button class="tableAddRows !p-0" style={$position} on:click={() => insertAction(true)}>
		<PlusIcon size="16" />
	</Button>
{/if}

{#if $isShownColumn}
	<Button class="tableAddColumns !p-0" style={$position} on:click={() => insertAction(false)}>
		<PlusIcon size="16" />
	</Button>
{/if}
