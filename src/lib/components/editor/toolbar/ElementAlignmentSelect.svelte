<script>
	import { onMount } from 'svelte';
	import { COMMAND_PRIORITY_CRITICAL, FORMAT_ELEMENT_COMMAND } from 'lexical';
	import { getEditor } from 'svelte-lexical';
	import { mergeRegister } from '@lexical/utils';
	import { AlignCenterIcon, AlignJustifyIcon, AlignLeftIcon, AlignRightIcon } from 'lucide-svelte';

	import Select from '$lib/components/Select.svelte';
	import { ELEMENT_CONSTANTS } from '$lib/constants/element';
	import { getSelectedElements } from '$lib/components/editor/utils/getSelection';

	/**
	 * @type {{[x: string]: typeof import('svelte').SvelteComponent<any>}}
	 */
	const alignmentIcons = {
		default: AlignLeftIcon,
		right: AlignRightIcon,
		center: AlignCenterIcon,
		justify: AlignJustifyIcon,
	};

	const { ALIGNMENT } = ELEMENT_CONSTANTS;
	const alignmentOptions = Object.entries(ALIGNMENT);

	const validValues = Object.keys(ALIGNMENT);

	/** @type {HTMLSelectElement} */
	let alignmentElement;

	let currentAlignment = '';

	const editor = getEditor();

	/** @param {Event} e */
	const alignment = (e) => {
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
		editor.read(() => {
			const nodes = getSelectedElements();
			const formats = [...new Set(nodes.map((node) => node.getFormatType()))];
			currentAlignment = formats.length > 1 ? 'mixed' : formats[0];
		});
	};

	onMount(() => {
		return mergeRegister(
			editor.registerUpdateListener(() => {
				updateToolbar();
			}),

			editor.registerCommand(
				FORMAT_ELEMENT_COMMAND,
				(format) => {
					const nodes = getSelectedElements();
					for (const node of nodes) {
						if (node !== null) {
							node.setFormat(format);
						}
					}
					return true;
				},
				COMMAND_PRIORITY_CRITICAL
			)
		);
	});
</script>

<div class="flex items-center gap-2 pl-2">
	<div>
		<svelte:component this={alignmentIcons[currentAlignment] || alignmentIcons.default} />
	</div>

	<Select
		title="Element alignment"
		bind:ref={alignmentElement}
		on:change={alignment}
		bind:value={currentAlignment}
		on:click={() => alignmentElement.dispatchEvent(new Event('change'))}
		class="!-ml-10 !px-10"
	>
		<option value="mixed" hidden>Mixed</option>
		<option value="" selected class="text-lg">Default</option>
		{#each alignmentOptions as [value, label]}
			<option {value} class="text-lg">{label}</option>
		{/each}
	</Select>
</div>
