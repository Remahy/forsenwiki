<script>
	import { $isVideoEmbedNode as isVideoEmbedNode } from '$lib/lexical/custom';
	import EditVideo from './EditVideo.svelte';

	/**
	 * @type {{ selectedNode: LexicalNode | null }}
	 */
	let { selectedNode = null } = $props();
</script>

{#if isVideoEmbedNode(selectedNode)}
	<div class="flex w-full flex-col justify-items-stretch">
		<div class="violet px-2 py-4 font-mono leading-none select-none" title="Video">Video</div>

		<div class="min-h-32 p-2">
			<EditVideo {selectedNode} />
		</div>
	</div>
{/if}
