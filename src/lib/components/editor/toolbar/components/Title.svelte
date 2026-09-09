<script>
	import DeleteNodeButton from './DeleteNodeButton.svelte';

	/**
	 * @typedef {{ text: string, children?: import('svelte').Snippet }} RequiredProps
	 * @typedef {{ selectedNode?: LexicalNode, hasDefaultDelete?: boolean }} ConditionalProps
	*/

	/**
	 * @type {RequiredProps & ConditionalProps}
	 */
	let { selectedNode, text, children, hasDefaultDelete = true } = $props();
</script>

<div class="flex items-center font-mono leading-none" title={text}>
	<span class="grow pl-2 py-3 select-none">{text}</span>
	{@render children?.()}
	{#if selectedNode && hasDefaultDelete}
		<DeleteNodeButton node={selectedNode} />
	{/if}
</div>
