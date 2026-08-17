<script>
	import { $isImageNode as isImageNode } from '$lib/lexical/custom';
	import EditImage from './EditImage.svelte';

	/**
	 * @type {{ selectedNode: LexicalNode | null }}
	 */
	let { selectedNode = null } = $props();
</script>

{#if isImageNode(selectedNode)}
	<div class="flex w-full flex-col justify-items-stretch">
		<div class="violet p-4 font-mono leading-none select-none" title="Image">Image</div>

		<div class="min-h-32 p-2">
			<EditImage selectedImageNode={selectedNode} />
		</div>
	</div>
{/if}
