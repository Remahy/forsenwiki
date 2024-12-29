<script>
	import {
		ArrowDownIcon,
		ArrowLeftIcon,
		ArrowRightIcon,
		ArrowUpIcon,
		Columns2Icon,
		PlusIcon,
		Rows2Icon,
	} from 'lucide-svelte';
	import { getEditor } from 'svelte-lexical';
	import {
		$insertTableRow__EXPERIMENTAL as insertTableRow__EXPERIMENTAL,
		$insertTableColumn__EXPERIMENTAL as insertTableColumn__EXPERIMENTAL,
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

	/** @param {boolean} [insertAfter] */
	const onClickAddColumn = (insertAfter) => {
		editor.update(() => {
			if (!selectedTable) {
				return;
			}

			insertTableColumn__EXPERIMENTAL(insertAfter);
		});
	};
</script>

<div
	class="forsen-wiki-theme-border flex items-center rounded border bg-violet-900 bg-opacity-50 text-sm text-white"
>
	<div class="flex items-center gap-2 p-2" title="Add row">
		<Rows2Icon size="16" /> <PlusIcon size="16" />
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

<div
	class="forsen-wiki-theme-border flex items-center rounded border bg-violet-900 bg-opacity-50 text-sm text-white"
>
	<div class="flex items-center gap-2 p-2" title="Add column">
		<Columns2Icon size="16" /> <PlusIcon size="16" />
	</div>

	<Button
		on:click={() => onClickAddColumn(false)}
		class="!min-w-8 !max-w-8 !rounded-none !p-0"
		title="Add before current column"
	>
		<ArrowLeftIcon size="20" />
	</Button>

	<Button
		on:click={() => onClickAddColumn()}
		class="!min-w-8 !max-w-8 !rounded-l-none !p-0"
		title="Add after current column"
	>
		<ArrowRightIcon size="20" />
	</Button>
</div>
