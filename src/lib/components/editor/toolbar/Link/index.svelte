<script>
	import { $isALinkNode as isALinkNode } from '$lib/lexical/custom';
	import Title from '../components/Title.svelte';
	import EditLink from './EditLink.svelte';

	/**
	 * @type {{ selectedNode: LexicalNode | null }}
	 */
	let { selectedNode = null } = $props();
</script>

{#if isALinkNode(selectedNode)}
	<div class="flex w-full flex-col justify-items-stretch">
		<Title {selectedNode} text="Link" />

		<div class="min-h-32 p-2">
			<EditLink {selectedNode} />
		</div>
	</div>
{/if}
