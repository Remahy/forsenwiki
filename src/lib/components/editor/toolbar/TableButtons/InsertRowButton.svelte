<script>
	import { ArrowDownIcon, ArrowUpIcon, Rows2Icon } from 'lucide-svelte';
	import { $getSelection as getSelection } from 'lexical';
	import { getEditor } from 'svelte-lexical';
	import {
		$isTableRowNode as isTableRowNode,
		$insertTableRow__EXPERIMENTAL as insertTableRow__EXPERIMENTAL,
	} from '@lexical/table';

	import Button from '$lib/components/Button.svelte';

	/** @type {import("@lexical/table").TableNode | null} */
	export let selectedTable = null;

	const editor = getEditor();

	/** @param {boolean} [insertAfter] */
	const onClick = (insertAfter) => {
		editor.update(() => {
			if (!selectedTable) {
				return;
			}

			const selection = getSelection();

			if (!selection) {
				return;
			}

			const [node] = selection.getNodes();

			if (!node) {
				return;
			}

			const closestTableRow = node.getParents().find((node) => isTableRowNode(node));

			if (!closestTableRow) {
				return;
			}

			insertTableRow__EXPERIMENTAL(insertAfter);
		});
	};
</script>

<div
	class="forsen-wiki-theme-border flex items-center rounded border bg-violet-900 bg-opacity-50 text-sm text-white"
>
	<div class="flex items-center gap-2 p-2">
		<Rows2Icon size="20" /> <span>Add row</span>
	</div>

	<Button
		on:click={() => onClick(false)}
		class="!min-w-8 !max-w-8 !rounded-none !p-0"
		title="Add before current row"
	>
		<ArrowUpIcon size="20" />
	</Button>

	<Button
		on:click={() => onClick()}
		class="!min-w-8 !max-w-8 !rounded-l-none !p-0"
		title="Add after current row"
	>
		<ArrowDownIcon size="20" />
	</Button>
</div>
