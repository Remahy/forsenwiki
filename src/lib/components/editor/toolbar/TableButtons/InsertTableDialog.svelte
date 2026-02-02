<script>
	// Based on umaranis' svelte-lexical

	import { onMount } from 'svelte';
	import { XIcon } from 'lucide-svelte';

	import Button from '$lib/components/Button.svelte';
	import { modal } from '$lib/stores/modal';

	/**
	 * @typedef Props
	 * @property {string} rows
	 * @property {string} columns
	 * @property {boolean} includeHeaders
	 * @property {(data: import('../../plugins/Overrides/Table/Table').TablePayload) => void} onSubmit
	 */

	/** @type {Props} */
	let { rows = '3', columns = '3', includeHeaders = true, onSubmit } = $props();

	let isDisabled = $state(true);

	onMount(() => {
		const row = Number(rows);
		const column = Number(columns);

		if (row && row > 0 && row <= 500 && column && column > 0 && column <= 50) {
			isDisabled = false;
		} else {
			isDisabled = true;
		}
	});

	const cancel = () => {
		$modal.isOpen = false;
	};

	const handleSubmit = () => {
		onSubmit({ columns: String(columns), rows: String(rows), includeHeaders });
		$modal.isOpen = false;
	};
</script>

<div class="modal-color pointer-events-auto relative p-0">
	<header class="forsen-wiki-theme-border flex items-center justify-between border-b p-6">
		<h1 class="text-xl font-semibold lg:text-2xl">Insert table</h1>
		<Button class="ml-auto inline-flex items-center rounded-lg" on:click={cancel}>
			<XIcon />
		</Button>
	</header>

	<main class="forsen-wiki-theme-border flex flex-col gap-8 overflow-hidden border-b p-6">
		<label class="flex items-center gap-2">
			<strong>Include headers</strong>
			<input bind:checked={includeHeaders} type="checkbox" />
		</label>

		<label class="flex flex-col gap-2">
			<strong>Rows</strong>
			<input
				bind:value={rows}
				class="input-color rounded-sm p-2"
				placeholder="# of rows (1-500)"
				type="number"
			/>
		</label>

		<label class="flex flex-col gap-2">
			<strong>Columns</strong>
			<input
				bind:value={columns}
				class="input-color rounded-sm p-2"
				placeholder="# of columns (1-50)"
				type="number"
			/>
		</label>
	</main>

	<footer class="flex items-center justify-end gap-2 p-6">
		<Button on:click={cancel}>Cancel</Button>
		<Button on:click={handleSubmit} disabled={isDisabled}>Submit</Button>
	</footer>
</div>
