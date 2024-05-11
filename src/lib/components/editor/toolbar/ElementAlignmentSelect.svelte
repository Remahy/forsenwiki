<script>
	import { FORMAT_ELEMENT_COMMAND, SELECTION_CHANGE_COMMAND } from 'lexical';
	import { getContext, onMount } from 'svelte';

	import Select from '$lib/components/Select.svelte';
	import { ELEMENT_CONSTANTS } from '$lib/constants/element';
	import { getSelectedElements } from '$lib/environment/utils';
	import { CriticalPriority } from '$lib/constants/lexical';

	const { ALIGNMENT } = ELEMENT_CONSTANTS;
	const alignmentOptions = Object.entries(ALIGNMENT);

	const validValues = Object.keys(ALIGNMENT);

	/** @type {HTMLSelectElement} */
	let alignmentElement;

	let currentAlignment = '';

	/** @type {ComposerWritable} */
	const c = getContext('COMPOSER');
	$: composer = $c;
	$: canEdit = composer?.getEditor().isEditable();
	$: editor = composer?.getEditor();

	/** @param {Event} e */
	const alignment = (e) => {
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

			/** @type {keyof typeof ALIGNMENT} */
			const value = /** @type {any} */ (target.value);

			if (!validValues.includes(value)) {
				editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, '');
				return;
			}

			editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, value);
		}
	};

	const updateToolbar = () => {
		if (!editor) return;

		editor.update(() => {
			const nodes = getSelectedElements();
			const formats = [...new Set(nodes.map((node) => node.getFormatType()))];
			currentAlignment = formats.length > 1 ? 'mixed' : formats[0];
		});
	};

	onMount(() => {
		c.subscribe((composer) => {
			if (composer === null) {
				return;
			}

			const editor = composer.getEditor();

			editor.registerCommand(
				SELECTION_CHANGE_COMMAND,
				(_payload) => {
					updateToolbar();
					return false;
				},
				CriticalPriority
			);
		});
	});
</script>

<Select
	title="Element alignment"
	disabled={!canEdit}
	bind:ref={alignmentElement}
	on:change={alignment}
	bind:value={currentAlignment}
	on:click={() => alignmentElement.dispatchEvent(new Event('change'))}
>
	<option value="mixed" hidden>Mixed</option>
	<option value="" selected>Default</option>
	{#each alignmentOptions as [value, label]}
		<option {value}>{label}</option>
	{/each}
</Select>
