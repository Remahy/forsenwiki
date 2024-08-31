<script>
	import {
		$isNodeSelection as isNodeSelection,
		COMMAND_PRIORITY_CRITICAL,
		$getSelection as getSelection,
		SELECTION_CHANGE_COMMAND,
	} from 'lexical';
	import {
		$patchStyleText as patchStyleText,
		$getSelectionStyleValueForProperty as getSelectionStyleValueForProperty,
	} from '@lexical/selection';
	import { getContext, onMount } from 'svelte';
	import { TypeIcon } from 'lucide-svelte';

	import Select from '$lib/components/Select.svelte';
	import { TEXT_CONSTANTS } from '$lib/constants/text';

	const { FONTFAMILIES } = TEXT_CONSTANTS;
	const validValues = Object.values(FONTFAMILIES);

	/** @type {HTMLSelectElement} */
	let fontElement;

	let currentFont = '';

	/** @type {ComposerWritable} */
	const c = getContext('COMPOSER');
	$: composer = $c;
	$: editor = composer?.getEditor?.();
	$: canEdit = editor?.isEditable();

	/** @param {Event} e */
	const font = (e) => {
		if (!editor) {
			return;
		}

		/** @type {HTMLSelectElement} */
		const target = /** @type {any} */ (e.target);
		if (target) {
			// This is only used as a placeholder, don't action on it.
			if (target.value === 'mixed') {
				return;
			}

			/** @type {validValues[any]} */
			const value = /** @type {any} */ (target.value);

			editor.update(() => {
				const selection = getSelection();
				if (selection !== null) {
					if (!validValues.includes(value)) {
						patchStyleText(selection, { ['font-family']: null });
						return;
					}

					patchStyleText(selection, { ['font-family']: value });
				}
			});
		}
	};

	const updateToolbar = () => {
		/** @type {RangeSelection | null} */
		const selection = /** @type {any} */ (getSelection());

		if (selection !== null && !isNodeSelection(selection)) {
			const value = getSelectionStyleValueForProperty(selection, 'font-family', 'default');

			if (value === '' && !selection.isCollapsed()) {
				currentFont = 'mixed';
				return;
			} else if (value === 'default') {
				currentFont = '';
				return;
			}

			currentFont = value;
		}
	};

	onMount(() => {
		c.subscribe((composer) => {
			if (!composer) {
				return;
			}
			const editor = composer.getEditor();

			editor.registerUpdateListener(({ editorState }) => {
				editorState.read(() => {
					updateToolbar();
				});
			});

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

<div class="flex items-center gap-2 pl-2">
	<TypeIcon />

	<Select
		title="Font family"
		disabled={!canEdit}
		bind:ref={fontElement}
		on:change={font}
		bind:value={currentFont}
		on:click={() => fontElement.dispatchEvent(new Event('change'))}
		class="-ml-10 px-10"
	>
		<option value="mixed" hidden>Mixed</option>
		<option value="" class="font-sans text-lg">Default font</option>
		<option value="monospace" class="font-mono text-lg">Monospace</option>
		<option value="OpenDyslexic" class="font-dyslexic text-lg">OpenDyslexic</option>
	</Select>
</div>
