<script>
	import { getContext, onMount } from 'svelte';
	import {
		$getSelection as getSelection,
		COMMAND_PRIORITY_CRITICAL,
		SELECTION_CHANGE_COMMAND,
	} from 'lexical';
	import { $isTableNode as isTableNode } from '@lexical/table';

	import Divider from '$lib/components/Divider.svelte';
	import InsertRowColumnButtons from './InsertRowColumnButtons.svelte';

	/** @type {import("@lexical/table").TableNode | null} */
	let selectedTable = null;

	/** @type {ComposerWritable} */
	const c = getContext('COMPOSER');

	const updateToolbar = () => {
		const selection = getSelection();

		if (!selection?.isCollapsed) {
			selectedTable = null;
			return;
		}

		const [node] = selection.getNodes();

		if (!node) {
			selectedTable = null;
			return;
		}

		const closestParentTable = node.getParents().find((node) => isTableNode(node));

		if (!closestParentTable) {
			selectedTable = null;
			return;
		}

		selectedTable = closestParentTable;
		return;
	};

	onMount(() => {
		c.subscribe((composer) => {
			if (composer === null) {
				return;
			}

			const editor = composer.getEditor();

			editor.registerCommand(
				SELECTION_CHANGE_COMMAND,
				() => {
					updateToolbar();
					return false;
				},
				COMMAND_PRIORITY_CRITICAL
			);
		});
	});
</script>

{#if selectedTable}
	<Divider />

	<div class="flex items-center gap-2">
		<div
			class="flex select-none flex-col items-center justify-center font-mono text-xs leading-none"
		>
			<span>T</span>
			<span>B</span>
			<span>L</span>
		</div>

		<InsertRowColumnButtons {selectedTable} />
	</div>
{/if}
