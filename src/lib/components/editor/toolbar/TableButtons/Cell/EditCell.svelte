<script>
	import { getEditor } from 'svelte-lexical';
	import { RectangleHorizontalIcon } from '@lucide/svelte';

	/**
	 * @typedef {Object} Props
	 * @property {import('$lib/lexical/custom').ATableNode | null} selectedTable
	 * @property {import('$lib/lexical/custom').ATableCellNode | null} selectedCell
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
			let widths = JSON.parse(JSON.stringify(selectedTable.getColWidths() || []));

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

<label title="Relative width" class="relative flex min-h-10.5 items-center gap-2">
	<span class="hidden">Width</span>
	<RectangleHorizontalIcon class="absolute left-4" />

	<input
		placeholder="Auto"
		class="input-color h-10 w-full p-0 pl-12 text-sm"
		bind:value={width}
		min={0}
		max={100}
		onchange={onChange}
	/>
</label>
