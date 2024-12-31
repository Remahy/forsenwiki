<script>
	import { onMount } from 'svelte';
	import {
		CAN_UNDO_COMMAND,
		UNDO_COMMAND,
		CAN_REDO_COMMAND,
		REDO_COMMAND,
		COMMAND_PRIORITY_LOW,
	} from 'lexical';
	import { getEditor } from 'svelte-lexical';
	import { mergeRegister } from '@lexical/utils';
	import { Redo2Icon, Undo2Icon } from 'lucide-svelte';

	import { ctrlKey } from '$lib/environment/environment';
	import EditorButton from './EditorButton.svelte';

	let canUndo = false;
	let canRedo = false;

	const editor = getEditor();

	const undo = () => {
		editor.dispatchCommand(UNDO_COMMAND, undefined);
	};

	const redo = () => {
		editor.dispatchCommand(REDO_COMMAND, undefined);
	};

	onMount(() => {
		return mergeRegister(
			editor.registerCommand(
				CAN_REDO_COMMAND,
				(payload) => {
					canRedo = payload;
					return false;
				},
				COMMAND_PRIORITY_LOW
			),
			editor.registerCommand(
				CAN_UNDO_COMMAND,
				(payload) => {
					canUndo = payload;
					return false;
				},
				COMMAND_PRIORITY_LOW
			)
		);
	});
</script>

<EditorButton title="Undo ({ctrlKey}Z)" on:click={undo} disabled={!canUndo}>
	<Undo2Icon size="16" />
</EditorButton>

<EditorButton title="Undo ({ctrlKey}Y)" on:click={redo} disabled={!canRedo}>
	<Redo2Icon size="16" />
</EditorButton>
