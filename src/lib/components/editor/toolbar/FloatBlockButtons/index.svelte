<script>
	import { $isFloatBlockNode as isFloatBlockNode } from '$lib/lexical/custom';
	import EditFloatBlock from './EditFloatBlock.svelte';
	
	/**
	 * @type {{ selectedNode: LexicalNode | null }}
	 */
	let { selectedNode = null } = $props();
</script>

{#if isFloatBlockNode(selectedNode)}
	<div class="w-full flex flex-col justify-items-stretch">
		<div
			class="font-mono leading-none select-none violet p-4"
			title="Float Block"
		>
			Float block
		</div>

		<EditFloatBlock selectedFloatBlockNode={selectedNode} />
	</div>
{/if}
