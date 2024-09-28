<script>
	import { getContext, onMount } from 'svelte';
	import {
		COMMAND_PRIORITY_CRITICAL,
		SELECTION_CHANGE_COMMAND,
		$getSelection as getSelection,
		$isNodeSelection as isNodeSelection,
	} from 'lexical';
	import { $isVideoEmbedNode as isVideoEmbedNode } from '$lib/lexical/custom';
	import EditVideo from './EditVideo.svelte';

	/** @type {import('$lib/lexical/custom').VideoEmbedNode | null} */
	let selectedVideoEmbedNode = null;

	/** @type {ComposerWritable} */
	const c = getContext('COMPOSER');

	const updateToolbar = () => {
		/**
		 * @type { BaseSelection & { hasFormat?: (format: string) => boolean } | null }
		 */
		const selection = getSelection();

		if (isNodeSelection(selection)) {
			const [node] = selection.getNodes();
			if (!isVideoEmbedNode(node)) {
				selectedVideoEmbedNode = null;
				return;
			}

			selectedVideoEmbedNode = node;
			return;
		}

		selectedVideoEmbedNode = null;
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

{#if selectedVideoEmbedNode}
	<div class="flex items-center gap-2">
		<div
			class="flex select-none flex-col items-center justify-center font-mono text-xs leading-none text-gray-400"
		>
			<span>V</span>
			<span>I</span>
			<span>D</span>
		</div>

		<EditVideo {selectedVideoEmbedNode} />
	</div>
{/if}
