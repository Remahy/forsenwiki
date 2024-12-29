<script>
	import { getContext, onMount } from 'svelte';
	import {
		COMMAND_PRIORITY_CRITICAL,
		SELECTION_CHANGE_COMMAND,
		$getSelection as getSelection,
		$isNodeSelection as isNodeSelection,
	} from 'lexical';
	import { $isImageNode as isImageNode } from '$lib/lexical/custom';
	import EditImage from './EditImage.svelte';

	/** @type {import('$lib/lexical/custom').ImageNode | null} */
	let selectedImageNode = null;

	/** @type {ComposerWritable} */
	const c = getContext('COMPOSER');

	const updateToolbar = () => {
		const selection = getSelection();

		if (isNodeSelection(selection)) {
			const [node] = selection.getNodes();
			if (!isImageNode(node)) {
				selectedImageNode = null;
				return;
			}

			selectedImageNode = node;
			return;
		}

		selectedImageNode = null;
	};

	onMount(() => {
		c.subscribe((composer) => {
			if (composer === null) {
				return;
			}

			const editor = composer.getEditor();

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

{#if selectedImageNode}
	<div class="flex items-center gap-2">
		<div
			class="flex select-none flex-col items-center justify-center font-mono text-xs leading-none"
		>
			<span>I</span>
			<span>M</span>
			<span>G</span>
		</div>

		<EditImage {selectedImageNode} />
	</div>
{/if}
