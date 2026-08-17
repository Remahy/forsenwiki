<script>
	import { $isFloatBlockNode as isFloatBlockNode } from '$lib/lexical/custom';
	import Title from '../components/Title.svelte';
	import EditFloatBlock from './EditFloatBlock.svelte';

	/**
	 * @type {{ selectedNode: LexicalNode | null }}
	 */
	let { selectedNode = null } = $props();
</script>

{#if isFloatBlockNode(selectedNode)}
	<div class="flex w-full flex-col justify-items-stretch">
		<Title {selectedNode} text="Float block" />

		<div class="min-h-32 p-2">
			<EditFloatBlock selectedFloatBlockNode={selectedNode} />
		</div>
	</div>
{/if}
