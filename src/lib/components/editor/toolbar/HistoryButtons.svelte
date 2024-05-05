<script>
	import { CAN_UNDO_COMMAND, UNDO_COMMAND, CAN_REDO_COMMAND, REDO_COMMAND } from 'lexical';
	import { Redo2Icon, Undo2Icon } from 'lucide-svelte';
	import { getContext, onMount } from 'svelte';

	import { ctrlKey } from '$lib/environment/environment';
	import Button from '$lib/components/Button.svelte';

	const LowPriority = 1;

	let canUndo = false;
	let canRedo = false;

	/** @type {ComposerWritable} */
	const c = getContext('COMPOSER');
	$: composer = $c;

	$: canEdit = composer?.getEditor().isEditable();

	const undo = () => {
		if (composer === null) return;

		const editor = composer.getEditor();
		editor.dispatchCommand(UNDO_COMMAND, undefined);
	};

	const redo = () => {
		if (composer === null) return;

		const editor = composer.getEditor();
		editor.dispatchCommand(REDO_COMMAND, undefined);
	};

	onMount(() => {
		c.subscribe((composer) => {
			if (composer === null) return;
			const editor = composer.getEditor();

			editor.registerCommand(
				CAN_REDO_COMMAND,
				(payload) => {
					canRedo = payload;
					return false;
				},
				LowPriority
			);
			editor.registerCommand(
				CAN_UNDO_COMMAND,
				(payload) => {
					canUndo = payload;
					return false;
				},
				LowPriority
			);
		});
	});
</script>

<Button title="Undo ({ctrlKey}Z)" on:click={undo} disabled={!canUndo || !canEdit}>
	<Undo2Icon size="16" />
</Button>

<Button title="Undo ({ctrlKey}Y)" on:click={redo} disabled={!canRedo || !canEdit}>
	<Redo2Icon size="16" />
</Button>
