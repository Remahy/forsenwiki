<script>
	import { Columns2Icon, MinusIcon, Rows2Icon } from 'lucide-svelte';
	import { getEditor } from 'svelte-lexical';
	import {
		$deleteTableColumn__EXPERIMENTAL as deleteTableColumn__EXPERIMENTAL,
		$deleteTableRow__EXPERIMENTAL as deleteTableRow__EXPERIMENTAL,
	} from '@lexical/table';

	import Button from '$lib/components/Button.svelte';

	/** @type {import("@lexical/table").TableNode | null} */
	export let selectedTable = null;

	const editor = getEditor();

	const onClickRemoveRow = () => {
		editor.update(() => {
			if (!selectedTable) {
				return;
			}

			deleteTableRow__EXPERIMENTAL()
		});
	};

	const onClickRemoveColumn = () => {
		editor.update(() => {
			if (!selectedTable) {
				return;
			}

			deleteTableColumn__EXPERIMENTAL()
		});
	};
</script>

<div class="flex gap-2 text-xs">
	<Button on:click={onClickRemoveRow} title="Remove row">
		<div class="flex items-center">
			<Rows2Icon size="16" />
			<MinusIcon size="16" />
		</div>
	</Button>

	<Button on:click={onClickRemoveColumn} title="Remove column">
		<div class="flex items-center">
			<Columns2Icon size="16" />
			<MinusIcon size="16" />
		</div>
	</Button>
</div>
