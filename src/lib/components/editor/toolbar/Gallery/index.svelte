<script>
	import { $isGalleryNode as isGalleryNode } from '$lib/lexical/custom';
	import Wrapper from '../components/Wrapper.svelte';
	import Title from '../components/Title.svelte';

	/**
	 * @type {{ selectedNode: LexicalNode | null }}
	 */
	let { selectedNode = null } = $props();
</script>

{#if isGalleryNode(selectedNode)}
	<Wrapper>
		{#snippet title()}
			<Title {selectedNode} text="Gallery" />
		{/snippet}

		{#snippet content()}
			<div class="p-2">
				<ul class="ml-5 list-disc">
					<li>Use the "Insert" button to add supported items.</li>
					<li>Drag the items in the treeview to change their order in the gallery.</li>
					<li class="opacity-50">
						<span class="font-semibold">Coming soon:</span> Each gallery item may also have supporting
						text, use each item's "Alt text" to modify the supporting text.
					</li>
				</ul>
			</div>
		{/snippet}
	</Wrapper>
{/if}
