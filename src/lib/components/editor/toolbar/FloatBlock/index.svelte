<script>
	import { $isFloatBlockNode as isFloatBlockNode } from '$lib/lexical/custom';
	import EditFloatBlock from './EditFloatBlock.svelte';

	/**
	 * @type {{ selectedNode: LexicalNode | null }}
	 */
	let { selectedNode = null } = $props();
</script>

{#if isFloatBlockNode(selectedNode)}
	<div class="flex w-full flex-col justify-items-stretch">
		<div class="violet px-2 py-4 font-mono leading-none select-none" title="Float Block">
			Float block
		</div>

		<div class="min-h-32 p-2">
			<EditFloatBlock selectedFloatBlockNode={selectedNode} />
		</div>
	</div>
{/if}
