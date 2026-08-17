<script>
	import { $isImageNode as isImageNode } from '$lib/lexical/custom';
	import Title from '../components/Title.svelte';
	import EditImage from './EditImage.svelte';

	/**
	 * @type {{ selectedNode: LexicalNode | null }}
	 */
	let { selectedNode = null } = $props();
</script>

{#if isImageNode(selectedNode)}
	<div class="flex w-full flex-col justify-items-stretch">
		<Title {selectedNode} text="Image" />

		<div class="p-2">
			<EditImage selectedImageNode={selectedNode} />
		</div>
	</div>
{/if}
