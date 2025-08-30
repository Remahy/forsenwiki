<script>
	import {
		$isRangeSelection as isRangeSelection,
		FORMAT_TEXT_COMMAND,
		$getSelection as getSelection,
	} from 'lexical';
	import { getEditor } from 'svelte-lexical';
	import { mergeRegister } from '@lexical/utils';
	import { BoldIcon, ItalicIcon } from 'lucide-svelte';

	import { ctrlKey } from '$lib/environment/environment';
	import EditorButton from '../EditorButton.svelte';
	import EditLinkButton from './EditLinkButton.svelte';

	let isBold = $state(false);
	
	let isItalic = $state(false);

	let editor = $derived(getEditor?.());

	const updateToolbar = () => {
		editor.read(() => {
			const selection = getSelection();

			if (!isRangeSelection(selection)) {
				return;
			}

			isBold = selection.hasFormat('bold');
			isItalic = selection.hasFormat('italic');
		});
	};

	const bold = () => {
		editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
	};

	const italic = () => {
		editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
	};

	$effect(() => {
		return mergeRegister(
			editor.registerUpdateListener(() => {
				updateToolbar();
			})
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
