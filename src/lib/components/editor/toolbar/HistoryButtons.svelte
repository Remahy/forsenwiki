<script>
	import {
		CAN_UNDO_COMMAND,
		UNDO_COMMAND,
		CAN_REDO_COMMAND,
		REDO_COMMAND,
		COMMAND_PRIORITY_LOW,
	} from 'lexical';
	import { Redo2Icon, Undo2Icon } from 'lucide-svelte';
	import { getContext, onMount } from 'svelte';

	import { ctrlKey } from '$lib/environment/environment';
	import Button from '$lib/components/Button.svelte';

	let canUndo = false;
	let canRedo = false;

	/** @type {ComposerWritable} */
	const c = getContext('COMPOSER');
	$: composer = $c;
	$: editor = composer?.getEditor?.();
	$: canEdit = editor?.isEditable();

	const undo = () => {
		if (!editor) {
			return;
		}

		editor.dispatchCommand(UNDO_COMMAND, undefined);
	};

	const redo = () => {
		if (!editor) {
			return;
		}

		editor.dispatchCommand(REDO_COMMAND, undefined);
	};

	onMount(() => {
		c.subscribe((composer) => {
			if (!composer) {
				return;
			}

			const editor = composer.getEditor();

			editor.registerCommand(
				CAN_REDO_COMMAND,
				(payload) => {
					canRedo = payload;
					return false;
				},
				COMMAND_PRIORITY_LOW
			);

			editor.registerCommand(
				CAN_UNDO_COMMAND,
				(payload) => {
					canUndo = payload;
					return false;
				},
				COMMAND_PRIORITY_LOW
			);
		});
	});
</script>

<Button
	title="Undo ({ctrlKey}Z)"
	on:click={undo}
	disabled={!canUndo || !canEdit}
	class="max-h-8 min-h-8 min-w-8 max-w-8 lg:max-h-[unset] lg:min-h-[unset]"
>
	<Undo2Icon size="16" />
</Button>

<Button
	title="Undo ({ctrlKey}Y)"
	on:click={redo}
	disabled={!canRedo || !canEdit}
	class="max-h-8 min-h-8 min-w-8 max-w-8 lg:max-h-[unset] lg:min-h-[unset]"
>
	<Redo2Icon size="16" />
</Button>
