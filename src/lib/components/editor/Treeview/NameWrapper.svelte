<script>
	import { $isTextNode as isTextNode } from 'lexical';

	/**
	 * @type {{ editor: LexicalEditor, node: LexicalNode, children?: import('svelte').Snippet }}
	 */
	const { editor, node, children } = $props();
</script>

{#if isTextNode(node)}
	<span
		class:font-bold={editor.read(() => node.hasFormat('bold'))}
		class:italic={editor.read(() => node.hasFormat('italic'))}
	>
		{@render children?.()}
	</span>
{:else}
	{@render children?.()}
{/if}
