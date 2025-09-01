<script>
	import { $getSelection as getSelection, $isNodeSelection as isNodeSelection } from 'lexical';
	import { getEditor } from 'svelte-lexical';
	import { mergeRegister } from '@lexical/utils';

	import { $isVideoEmbedNode as isVideoEmbedNode } from '$lib/lexical/custom';
	import Divider from '$lib/components/Divider.svelte';
	import EditVideo from './EditVideo.svelte';

	/** @type {import('$lib/lexical/custom').VideoEmbedNode | null} */
	let selectedVideoEmbedNode = $state(null);

	const editor = getEditor();

	const updateToolbar = () => {
		editor.read(() => {
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
		});
	};

	$effect(() => {
		return mergeRegister(
			editor.registerUpdateListener(() => {
				updateToolbar();
			})
		);
	});
</script>

{#if selectedVideoEmbedNode}
	<Divider />

	<div class="flex select-none flex-col items-center justify-center font-mono text-xs leading-none">
		<span>V</span>
		<span>I</span>
		<span>D</span>
	</div>

	<EditVideo {selectedVideoEmbedNode} />
{/if}
