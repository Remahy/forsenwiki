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
	import EditorButton from './EditorButton.svelte';

	let canUndo = $state(false);
	let canRedo = $state(false);

	/** @type {ComposerWritable} */
	const c = getContext('COMPOSER');
	let composer = $derived($c);
	let editor = $derived(composer?.getEditor?.());
	let canEdit = $derived(editor?.isEditable());

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

<EditorButton title="Undo ({ctrlKey}Z)" on:click={undo} disabled={!canUndo || !canEdit}>
	<Undo2Icon size="16" />
</EditorButton>

<EditorButton title="Undo ({ctrlKey}Y)" on:click={redo} disabled={!canRedo || !canEdit}>
	<Redo2Icon size="16" />
</EditorButton>
