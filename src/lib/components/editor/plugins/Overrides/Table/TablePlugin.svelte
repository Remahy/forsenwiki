<script lang="ts">
	// Based on umaranis' svelte-lexical
	import { onMount } from 'svelte';
	import { mergeRegister, $isTextNode as isTextNode, COMMAND_PRIORITY_NORMAL } from 'lexical';
	import { $insertNodeToNearestRoot as insertNodeToNearestRoot } from '@lexical/utils';
	import {
		INSERT_TABLE_COMMAND,
		registerTableCellUnmergeTransform,
		registerTablePlugin,
		registerTableSelectionObserver,
		setScrollableTablesActive,
		TableCellNode,
		$createTableNodeWithDimensions as createTableNodeWithDimensions,
		type InsertTableCommandPayloadHeaders,
	} from '@lexical/table';
	import { getEditor } from 'svelte-lexical';

	import { modal } from '$lib/stores/modal';
	import InsertTableDialog from '$lib/components/editor/toolbar/TableButtons/InsertTableDialog.svelte';

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
		const unregisterTableInsertCmd = editor.registerCommand(
			INSERT_TABLE_COMMAND,
			({ columns, rows, includeHeaders }) => {
				wrapperInsertTable({ columns, rows, includeHeaders });

				return true;
			},
			COMMAND_PRIORITY_NORMAL
		);

		return mergeRegister(unregisterTableInsertCmd);
	});
</script>
