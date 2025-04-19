<script>
	import { onMount } from 'svelte';
	import {
		$isNodeSelection as isNodeSelection,
		$getSelection as getSelection,
		$isRangeSelection as isRangeSelection,
	} from 'lexical';
	import { getEditor } from 'svelte-lexical';
	import {
		$patchStyleText as patchStyleText,
		$getSelectionStyleValueForProperty as getSelectionStyleValueForProperty,
	} from '@lexical/selection';
	import { mergeRegister } from '@lexical/utils';
	import { TypeIcon } from 'lucide-svelte';

	import Select from '$lib/components/Select.svelte';
	import { TEXT_CONSTANTS } from '$lib/constants/text';

	const { FONTFAMILIES } = TEXT_CONSTANTS;
	const validValues = Object.values(FONTFAMILIES);

	/** @type {HTMLSelectElement | null} */
	let fontElement = $state(null);

	let currentFont = $state('');

	let editor = $derived(getEditor?.());

	/** @param {Event} e */
	const font = (e) => {
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
		editor.read(() => {
			const selection = getSelection();

			if (!isRangeSelection(selection)) {
				return;
			}

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
		});
	};

	onMount(() => {
		return mergeRegister(
			editor.registerUpdateListener(() => {
				updateToolbar();
			})
		);
	});
</script>

<div class="flex items-center gap-2 pl-2">
	<TypeIcon />

	<Select
		title="Font family"
		bind:ref={fontElement}
		on:change={font}
		bind:value={currentFont}
		on:click={() => fontElement?.dispatchEvent(new Event('change'))}
		class="!-ml-10 !px-10"
	>
		<option value="mixed" hidden>Mixed</option>
		<option value="" class="font-sans text-lg">Default font</option>
		<option value="monospace" class="font-mono text-lg">Monospace</option>
		<option value="OpenDyslexic" class="font-dyslexic text-lg">OpenDyslexic</option>
	</Select>
</div>
