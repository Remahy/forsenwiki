<script>
	import { getContext, onMount } from 'svelte';
	import EditImage from './EditImage.svelte';
	import {
		COMMAND_PRIORITY_CRITICAL,
		SELECTION_CHANGE_COMMAND,
		$getSelection as getSelection,
		$isNodeSelection as isNodeSelection
	} from 'lexical';
	import { $isImageNode as isImageNode } from '../../plugins/Image';

	/** @type {import( '../../plugins/Image').ImageNode | null} */
	let selectedImageNode = null;

	/** @type {ComposerWritable} */
	const c = getContext('COMPOSER');
	$: composer = $c;
	$: canEdit = composer?.getEditor().isEditable();
	$: editor = composer?.getEditor();

	const updateToolbar = () => {
		/**
		 * @type { BaseSelection & { hasFormat?: (format: string) => boolean } | null }
		 */
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
				(_payload) => {
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
		<span>Image options</span>
		<EditImage {selectedImageNode} />
	</div>
{/if}
