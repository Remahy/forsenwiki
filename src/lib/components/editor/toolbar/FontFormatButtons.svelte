<script>
	import {
		FORMAT_TEXT_COMMAND,
		SELECTION_CHANGE_COMMAND,
		$getSelection as getSelection
	} from 'lexical';
	import { BoldIcon, ItalicIcon } from 'lucide-svelte';
	import { getContext, onMount } from 'svelte';

	import Button from '$lib/components/Button.svelte';
	import { ctrlKey } from '$lib/environment/environment';

	const LowPriority = 1;

	$: isBold = false;
	$: isItalic = false;

	/**
	 * @type {Writable<{ getEditor: () => LexicalEditor} | null>}
	 */
	const c = getContext('COMPOSER');
	$: composer = $c;

	$: canEdit = composer?.getEditor().isEditable();

	const updateToolbar = () => {
		/**
		 * @type { BaseSelection & { hasFormat?: (format: string) => boolean } | null }
		 */
		const selection = getSelection();

		if (!selection?.hasFormat) return;

		isBold = selection.hasFormat('bold');
		isItalic = selection.hasFormat('italic');
	};

	const bold = () => {
		if (composer === null) return;

		const editor = composer.getEditor();
		editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
	};

	const italic = () => {
		if (composer === null) return;

		const editor = composer.getEditor();
		editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
	};

	onMount(() => {
		c.subscribe((composer) => {
			if (composer === null) return;
			const editor = composer.getEditor();
			editor.registerUpdateListener(({ editorState }) => {
				editorState.read(() => {
					updateToolbar();
				});
			});
			editor.registerCommand(
				SELECTION_CHANGE_COMMAND,
				(_payload) => {
					updateToolbar();
					return false;
				},
				LowPriority
			);
		});
	});
</script>

<Button title="Bold ({ctrlKey}B)" on:click={bold} disabled={!canEdit} isActive={isBold}>
	<BoldIcon size="16" />
</Button>

<Button title="Italic ({ctrlKey}B)" on:click={italic} disabled={!canEdit} isActive={isItalic}>
	<ItalicIcon size="16" />
</Button>
