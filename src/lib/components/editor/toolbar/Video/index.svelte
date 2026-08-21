<script>
	import { $isVideoEmbedNode as isVideoEmbedNode } from '$lib/lexical/custom';
	import Wrapper from '../components/Wrapper.svelte';
	import Title from '../components/Title.svelte';
	import EditVideo from './EditVideo.svelte';

	/**
	 * @type {{ selectedNode: LexicalNode | null }}
	 */
	let { selectedNode = null } = $props();
</script>

{#if isVideoEmbedNode(selectedNode)}
	<Wrapper>
		{#snippet title()}
			<Title {selectedNode} text="Video" />
		{/snippet}

		{#snippet content()}
			<div class="p-2">
				<EditVideo {selectedNode} />
			</div>
		{/snippet}
	</Wrapper>
{/if}
