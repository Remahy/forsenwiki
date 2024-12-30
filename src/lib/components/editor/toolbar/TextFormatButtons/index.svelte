<script>
	import { onMount } from 'svelte';
	import {
		$isRangeSelection as isRangeSelection,
		COMMAND_PRIORITY_CRITICAL,
		FORMAT_TEXT_COMMAND,
		SELECTION_CHANGE_COMMAND,
		$getSelection as getSelection,
	} from 'lexical';
	import { getEditor } from 'svelte-lexical';
	import { BoldIcon, ItalicIcon } from 'lucide-svelte';

	import { ctrlKey } from '$lib/environment/environment';
	import EditorButton from '../EditorButton.svelte';
	import EditLinkButton from './EditLinkButton.svelte';

	$: isBold = false;
	$: isItalic = false;

	const editor = getEditor();

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
		return editor.registerCommand(
			SELECTION_CHANGE_COMMAND,
			() => {
				updateToolbar();
				return false;
			},
			COMMAND_PRIORITY_CRITICAL
		);
	});
</script>

<EditorButton title="Bold ({ctrlKey}B)" on:click={bold} isActive={isBold}>
	<BoldIcon size="16" />
</EditorButton>

<EditorButton title="Italic ({ctrlKey}I)" on:click={italic} isActive={isItalic}>
	<ItalicIcon size="16" />
</EditorButton>

<EditLinkButton />
