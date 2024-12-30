<script>
	import { PlusIcon, MinusIcon, ArrowLeftIcon, ArrowRightIcon } from 'lucide-svelte';
	import { getEditor } from 'svelte-lexical';
	import {
		$insertTableColumn__EXPERIMENTAL as insertTableColumn__EXPERIMENTAL,
		$deleteTableColumn__EXPERIMENTAL as deleteTableColumn__EXPERIMENTAL,
	} from '@lexical/table';

	import Button from '$lib/components/Button.svelte';

	/** @type {import("@lexical/table").TableNode | null} */
	export let selectedTable = null;

	const editor = getEditor();

	/** @param {boolean} [insertAfter] */
	const onClickAddColumn = (insertAfter) => {
		editor.update(() => {
			if (!selectedTable) {
				return;
			}

			insertTableColumn__EXPERIMENTAL(insertAfter);
		});
	};

	const onClickRemoveColumn = () => {
		editor.update(() => {
			if (!selectedTable) {
				return;
			}

			deleteTableColumn__EXPERIMENTAL();
		});
	};
</script>

<div class="forsen-wiki-theme-outline flex items-center gap-2 outline-offset-8">
	<div class="flex select-none flex-col items-center justify-center font-mono text-xs leading-none">
		<span>C</span>
		<span>O</span>
		<span>L</span>
	</div>

	<div
		class="forsen-wiki-theme-border flex items-center rounded border bg-violet-900 dark:bg-opacity-50 text-sm text-white"
	>
		<div class="flex items-center gap-2 p-2" title="Add column">
			<PlusIcon size="16" />
		</div>

		<Button
			on:click={() => onClickAddColumn(false)}
			class="!min-w-8 !max-w-8 !rounded-none !p-0"
			title="Add to the left of current column"
		>
			<ArrowLeftIcon size="20" />
		</Button>

		<Button
			on:click={() => onClickAddColumn()}
			class="!min-w-8 !max-w-8 !rounded-l-none !p-0"
			title="Add to the right of current column"
		>
			<ArrowRightIcon size="20" />
		</Button>
	</div>

	<Button on:click={onClickRemoveColumn} class="!p-0" title="Remove column">
		<MinusIcon size="20" />
	</Button>
</div>
