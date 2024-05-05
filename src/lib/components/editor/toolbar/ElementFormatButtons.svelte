<script>
	import {
		FORMAT_ELEMENT_COMMAND,
		SELECTION_CHANGE_COMMAND,
		$getSelection as getSelection
	} from 'lexical';
	import { getContext, onMount } from 'svelte';

	import Select from '$lib/components/Select.svelte';
	import { ELEMENT_CONSTANTS } from '$lib/constants/element';
	import { getSelectedElements } from '$lib/environment/utils';

	const LowPriority = 1;

	const { ALIGNMENT } = ELEMENT_CONSTANTS;
	const validValues = Object.values(ALIGNMENT);

	/** @type {HTMLSelectElement} */
	let alignmentElement;

	let currentAlignment = '';

	/**
	 * @type {Writable<{ getEditor: () => LexicalEditor} | null>}
	 */
	const c = getContext('COMPOSER');
	$: composer = $c;

	$: canEdit = composer?.getEditor().isEditable();

	/** @param {Event} e */
	const alignment = (e) => {
		if (composer === null) return;

		/** @type {HTMLSelectElement} */
		const target = /** @type {any} */ (e.target);
		if (target) {
			// This is only used as a placeholder, don't action on it.
			if (target.value === 'mixed') return;

			/** @type {validValues[any]} */
			const value = /** @type {any} */ (target.value);

			const editor = composer.getEditor();

			if (!validValues.includes(value)) {
				editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, '');
				return;
			}

			editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, value);
		}
	};

	const updateToolbar = () => {
		/**
		 * @type { BaseSelection & { hasFormat?: (format: string) => boolean } | null }
		 */
		const selection = getSelection();

		if (!selection?.hasFormat) return;

		const nodes = getSelectedElements();
		const formats = [...new Set(nodes.map((node) => node.getFormatType()))];
		currentAlignment = formats.length > 1 ? 'mixed' : formats[0];
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

		console.log(JSON.stringify(alignmentElement.selectedIndex))
	});
</script>

<Select
	disabled={!canEdit}
	bind:ref={alignmentElement}
	on:change={alignment}
	bind:value={currentAlignment}
	on:click={() => alignmentElement.dispatchEvent(new Event('change'))}
>
	<option value="mixed" hidden>Mixed</option>
	<option value="" selected>Default</option>
	<option value={ALIGNMENT.LEFT}>Left</option>
	<option value={ALIGNMENT.CENTER}>Center</option>
	<option value={ALIGNMENT.RIGHT}>Right</option>
	<option value={ALIGNMENT.JUSTIFY}>Justify</option>
</Select>
