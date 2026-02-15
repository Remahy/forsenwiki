<script>
	import { getEditor } from 'svelte-lexical';
	import { RectangleHorizontalIcon } from 'lucide-svelte';

	/**
	 * @typedef {Object} Props
	 * @property {import('@lexical/table').TableNode | null} selectedTable
	 * @property {import('@lexical/table').TableCellNode | null} selectedCell
	 */

	/** @type {Props} */
	let { selectedTable, selectedCell } = $props();

	const editor = getEditor();

	let colIndex = $derived.by(() => editor.read(() => selectedCell?.getIndexWithinParent()));

	let currentWidth = $derived.by(() =>
		typeof colIndex === 'number'
			? editor.read(() => selectedTable?.getColWidths()?.[colIndex])
			: undefined
	);

	let width = $derived(currentWidth);

	const onChange = () => {
		if (typeof colIndex !== 'number') {
			return;
		}

		if (!selectedTable) {
			return;
		}

		editor.update(() => {
			let widths = JSON.parse(JSON.stringify(selectedTable.getColWidths()));

			if (!widths?.length) {
				const maxCols = selectedTable.getColumnCount();
				widths = new Array(maxCols).fill(undefined);
			}

			// @ts-ignore
			widths[colIndex] = width;

			selectedTable?.setColWidths(widths);
		});
	};
</script>

<div class="forsen-wiki-theme-outline flex items-center gap-2 outline-offset-8 m-2">
	<div class="flex flex-col items-center justify-center font-mono text-xs leading-none select-none">
		<span>C</span>
		<span>L</span>
		<span>L</span>
	</div>
	<label title="Relative width" class="flex min-h-10.5 items-center gap-2 pl-2">
		<span class="hidden">Width</span>
		<RectangleHorizontalIcon />

		<input
			placeholder="Fill"
			class="input-color -ml-10 h-10 w-28 p-0 pl-10 text-sm"
			bind:value={width}
			min={0}
			max={100}
			onchange={onChange}
		/>
	</label>
</div>
