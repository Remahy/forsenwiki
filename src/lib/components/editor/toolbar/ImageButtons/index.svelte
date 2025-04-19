<script>
	import { onMount } from 'svelte';
	import { $getSelection as getSelection, $isNodeSelection as isNodeSelection } from 'lexical';
	import { getEditor } from 'svelte-lexical';
	import { mergeRegister } from '@lexical/utils';

	import { $isImageNode as isImageNode } from '$lib/lexical/custom';
	import Divider from '$lib/components/Divider.svelte';
	import EditImage from './EditImage.svelte';

	/** @type {import('$lib/lexical/custom').ImageNode | null} */
	let selectedImageNode = $state(null);

	const editor = getEditor();

	const updateToolbar = () => {
		editor.read(() => {
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

{#if selectedImageNode}
	<Divider />

	<div class="flex select-none flex-col items-center justify-center font-mono text-xs leading-none">
		<span>I</span>
		<span>M</span>
		<span>G</span>
	</div>

	<EditImage {selectedImageNode} />
{/if}
