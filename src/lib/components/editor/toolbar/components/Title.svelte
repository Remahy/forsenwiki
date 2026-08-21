<script>
	import DeleteNodeButton from './DeleteNodeButton.svelte';

	/**
	 * @type {{ selectedNode: LexicalNode, text: string, hasDefaultDelete?: boolean, children?: import('svelte').Snippet }}
	 */
	let { selectedNode, text, children, hasDefaultDelete = true } = $props();
</script>

<div class="violet flex items-center font-mono leading-none" title={text}>
	<span class="grow pl-2 py-3 select-none">{text}</span>
	{@render children?.()}
	{#if hasDefaultDelete}
		<DeleteNodeButton node={selectedNode} />
	{/if}
</div>
