<script>
	import { onMount } from 'svelte';
	import { BoldIcon, ItalicIcon, SubscriptIcon, SuperscriptIcon } from '@lucide/svelte';
	import {
		$isRangeSelection as isRangeSelection,
		FORMAT_TEXT_COMMAND,
		$getSelection as getSelection,
		mergeRegister,
	} from 'lexical';
	import { getEditor } from 'svelte-lexical';

	import { ctrlKey } from '$lib/environment/environment';
	import EditorButton from '../EditorButton.svelte';
	import EditLinkButton from './EditLinkButton.svelte';

	let isBold = $state(false);
	let isItalic = $state(false);
	let isSuperscript = $state(false);
	let isSubscript = $state(false);

	let editor = $derived(getEditor?.());

	const updateToolbar = () => {
		editor.read(() => {
			const selection = getSelection();

			if (!isRangeSelection(selection)) {
				return;
			}

			isBold = selection.hasFormat('bold');
			isItalic = selection.hasFormat('italic');
			isSuperscript = selection.hasFormat('superscript');
			isSubscript = selection.hasFormat('subscript');
		});
	};

	const bold = () => {
		editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
	};

	const italic = () => {
		editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
	};

	const superscript = () => {
		editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript');
	};

	const subscript = () => {
		editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript');
	};

	onMount(() => {
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

<EditorButton title="Superscript" on:click={superscript} isActive={isSuperscript}>
	<SuperscriptIcon size="16" />
</EditorButton>

<EditorButton title="Subscript" on:click={subscript} isActive={isSubscript}>
	<SubscriptIcon size="16" />
</EditorButton>

<EditLinkButton />
