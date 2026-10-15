<script>
	import { onMount } from 'svelte';
	import {
		COMMAND_PRIORITY_NORMAL,
		FORMAT_TEXT_COMMAND,
		KEY_DOWN_COMMAND,
		mergeRegister,
	} from 'lexical';
	import { getEditor } from 'svelte-lexical';

	/** @type {import('lexical').LexicalEditor} */
	const editor = getEditor();

	/** @type {Record<string, import('lexical').TextFormatType>} */
	const formatKeycodes = {
		Equal: 'superscript',
		Minus: 'subscript',
	};

	onMount(() => {
		return mergeRegister(
			editor.registerCommand(
				KEY_DOWN_COMMAND,
				(event) => {
					const { code, ctrlKey, metaKey, shiftKey, altKey } = event;
					const format = formatKeycodes[code];

					const hasKeyCombo = (ctrlKey || metaKey) && shiftKey && !altKey;

					if (!format || !hasKeyCombo || !editor.isEditable()) {
						return false;
					}

					event.preventDefault();
					editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);

					return true;
				},
				COMMAND_PRIORITY_NORMAL
			)
		);
	});
</script>
