<script>
	import { $isFloatBlockNode as isFloatBlockNode } from '$lib/lexical/custom';
	import Wrapper from '../components/Wrapper.svelte';
	import Title from '../components/Title.svelte';
	import EditFloatBlock from './EditFloatBlock.svelte';

	/**
	 * @type {{ selectedNode: LexicalNode | null }}
	 */
	let { selectedNode = null } = $props();
</script>

{#if isFloatBlockNode(selectedNode)}
	<Wrapper>
		{#snippet title()}
			<Title {selectedNode} text="Float block" />
		{/snippet}

		{#snippet content()}
			<div class="p-2">
				<EditFloatBlock selectedFloatBlockNode={selectedNode} />
			</div>
		{/snippet}
	</Wrapper>
{/if}
