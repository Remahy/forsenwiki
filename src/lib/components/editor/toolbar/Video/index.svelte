<script>
	import { $isVideoEmbedNode as isVideoEmbedNode } from '$lib/lexical/custom';
	import Title from '../components/Title.svelte';
	import EditVideo from './EditVideo.svelte';

	/**
	 * @type {{ selectedNode: LexicalNode | null }}
	 */
	let { selectedNode = null } = $props();
</script>

{#if isVideoEmbedNode(selectedNode)}
	<div class="flex w-full flex-col justify-items-stretch">
		<Title {selectedNode} text="Video" />

		<div class="p-2">
			<EditVideo {selectedNode} />
		</div>
	</div>
{/if}
