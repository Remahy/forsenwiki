<script>
	import {
		$isRangeSelection as isRangeSelection,
		COMMAND_PRIORITY_CRITICAL,
		FORMAT_TEXT_COMMAND,
		SELECTION_CHANGE_COMMAND,
		$getSelection as getSelection,
	} from 'lexical';
	import { BoldIcon, ItalicIcon } from 'lucide-svelte';
	import { getContext, onMount } from 'svelte';

	import EditorButton from '../EditorButton.svelte';
	import { ctrlKey } from '$lib/environment/environment';
	import EditLinkButton from './EditLinkButton.svelte';

	$: isBold = false;
	$: isItalic = false;

	/** @type {ComposerWritable} */
	const c = getContext('COMPOSER');
	$: composer = $c;
	$: editor = composer?.getEditor?.();
	$: canEdit = editor?.isEditable();

	const updateToolbar = () => {
		const selection = getSelection();

		if (!isRangeSelection(selection)) {
			return;
		}

		isBold = selection.hasFormat('bold');
		isItalic = selection.hasFormat('italic');
	};

	const bold = () => {
		if (!editor) {
			return;
		}
		editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
	};

	const italic = () => {
		if (!editor) {
			return;
		}

		editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
	};

	onMount(() => {
		c.subscribe((composer) => {
			if (!composer) {
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

<EditorButton title="Bold ({ctrlKey}B)" on:click={bold} disabled={!canEdit} isActive={isBold}>
	<BoldIcon size="16" />
</EditorButton>

<EditorButton title="Italic ({ctrlKey}I)" on:click={italic} disabled={!canEdit} isActive={isItalic}>
	<ItalicIcon size="16" />
</EditorButton>

<EditLinkButton />
