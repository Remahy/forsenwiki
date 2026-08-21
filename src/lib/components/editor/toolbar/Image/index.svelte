<script>
	import { $isImageNode as isImageNode } from '$lib/lexical/custom';
	import Wrapper from '../components/Wrapper.svelte';
	import Title from '../components/Title.svelte';
	import EditImage from './EditImage.svelte';

	/**
	 * @type {{ selectedNode: LexicalNode | null }}
	 */
	let { selectedNode = null } = $props();
</script>

{#if isImageNode(selectedNode)}
	<Wrapper>
		{#snippet title()}
			<Title {selectedNode} text="Image" />
		{/snippet}

		{#snippet content()}
			<div class="p-2">
				<EditImage selectedImageNode={selectedNode} />
			</div>
		{/snippet}
	</Wrapper>
{/if}
