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

	const isBold = $derived(isTextNode(node) && editor.read(() => node.hasFormat('bold')));
	const isItalic = $derived(isTextNode(node) && editor.read(() => node.hasFormat('italic')));
	const isSuperscript = $derived(
		isTextNode(node) && editor.read(() => node.hasFormat('superscript'))
	);
	const isSubscript = $derived(isTextNode(node) && editor.read(() => node.hasFormat('subscript')));
</script>

{#if isTextNode(node)}
	<span class:font-bold={isBold} class:italic={isItalic}>
		{#if isSuperscript}
			<sup>{label}</sup>
		{:else if isSubscript}
			<sub>{label}</sub>
		{:else}
			{label}
		{/if}
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
