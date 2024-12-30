<script>
	import { PlusIcon, MinusIcon, ArrowUpIcon, ArrowDownIcon } from 'lucide-svelte';
	import { getEditor } from 'svelte-lexical';
	import {
		$insertTableRow__EXPERIMENTAL as insertTableRow__EXPERIMENTAL,
		$deleteTableRow__EXPERIMENTAL as deleteTableRow__EXPERIMENTAL,
	} from '@lexical/table';

	import Button from '$lib/components/Button.svelte';

	/** @type {import("@lexical/table").TableNode | null} */
	export let selectedTable = null;

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
</script>

<div class="forsen-wiki-theme-outline mx-2 flex items-center gap-2 outline-offset-8">
	<div class="flex select-none flex-col items-center justify-center font-mono text-xs leading-none">
		<span>R</span>
		<span>O</span>
		<span>W</span>
	</div>

	<div
		class="forsen-wiki-theme-border flex items-center rounded border bg-violet-900 dark:bg-opacity-50 text-sm text-white"
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
</div>
