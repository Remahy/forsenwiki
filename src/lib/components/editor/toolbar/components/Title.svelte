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
	<span class="grow py-3 pl-2 capitalize select-none">{text}</span>
	{@render children?.()}
	{#if selectedNode && hasDefaultDelete}
		<DeleteNodeButton node={selectedNode} />
	{/if}
</div>
