<script>
	import { $isALinkNode as isALinkNode } from '$lib/lexical/custom';
	import EditLink from './EditLink.svelte';

	/**
	 * @type {{ selectedNode: LexicalNode | null }}
	 */
	let { selectedNode = null } = $props();
</script>

{#if isALinkNode(selectedNode)}
	<div class="flex w-full flex-col justify-items-stretch">
		<div class="violet px-2 py-4 font-mono leading-none select-none" title="Link">Link</div>

		<div class="min-h-32 p-2">
			<EditLink {selectedNode} />
		</div>
	</div>
{/if}
