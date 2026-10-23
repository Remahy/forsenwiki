<script>
	import { $isVideoEmbedNode as isVideoEmbedNode } from '#lib/lexical/custom.js';
	import Wrapper from '../components/Wrapper.svelte';
	import Title from '../components/Title.svelte';
	import EditVideo from './EditVideo.svelte';

	/**
	 * @type {{ selectedNode: LexicalNode | null }}
	 */
	let { selectedNode = null } = $props();
</script>

{#if isVideoEmbedNode(selectedNode)}
	{@const fileType = selectedNode.__fileType}

	<Wrapper>
		{#snippet title()}
			<Title {selectedNode} text={fileType || 'Video'} />
		{/snippet}

		{#snippet content()}
			<div class="p-2">
				<EditVideo {selectedNode} />
			</div>
		{/snippet}
	</Wrapper>
{/if}
