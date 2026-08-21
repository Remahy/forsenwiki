<script>
	import { $isTextNode as isTextNode } from 'lexical';
	import { getTypeLabelForNode } from './utils';

	/**
	 * @type {{ editor: LexicalEditor, item: import('@headless-tree/core').ItemInstance<LexicalNode> }}
	 */
	const { editor, item } = $props();

	const node = $derived(item.getItemData());
	const label = $derived(item.getItemName());

	const typeLabel = $derived(editor.read(() => getTypeLabelForNode(node)));
</script>

{#if isTextNode(node)}
	<span
		class:font-bold={editor.read(() => node.hasFormat('bold'))}
		class:italic={editor.read(() => node.hasFormat('italic'))}
	>
		{label}
	</span>
{:else}
	{#if label !== typeLabel && label.length}
		<span title={typeLabel}>
			<span>{typeLabel}</span>
			<span class="text-xs opacity-80">{label}</span>
		</span>
	{:else if label.length === 0}
		<span class="italic">{typeLabel}</span>
	{:else}
		<span>{typeLabel}</span>
	{/if}
{/if}
