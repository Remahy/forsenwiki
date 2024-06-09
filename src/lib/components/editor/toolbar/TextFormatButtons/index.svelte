<script>
	import {
		COMMAND_PRIORITY_CRITICAL,
		FORMAT_TEXT_COMMAND,
		SELECTION_CHANGE_COMMAND,
		$getSelection as getSelection,
	} from 'lexical';
	import { BoldIcon, ItalicIcon } from 'lucide-svelte';
	import { getContext, onMount } from 'svelte';

	import Button from '$lib/components/Button.svelte';
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
		/**
		 * @type { BaseSelection & { hasFormat?: (format: string) => boolean } | null }
		 */
		const selection = getSelection();

		if (!selection?.hasFormat) {
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
				(_payload) => {
					updateToolbar();
					return false;
				},
				COMMAND_PRIORITY_CRITICAL
			);
		});
	});
</script>

<Button
	title="Bold ({ctrlKey}B)"
	on:click={bold}
	disabled={!canEdit}
	isActive={isBold}
	class="max-h-8 min-h-8 min-w-8 max-w-8 lg:max-h-[unset] lg:min-h-[unset]"
>
	<BoldIcon size="16" />
</Button>

<Button
	title="Italic ({ctrlKey}I)"
	on:click={italic}
	disabled={!canEdit}
	isActive={isItalic}
	class="max-h-8 min-h-8 min-w-8 max-w-8 lg:max-h-[unset] lg:min-h-[unset]"
>
	<ItalicIcon size="16" />
</Button>

<EditLinkButton />
