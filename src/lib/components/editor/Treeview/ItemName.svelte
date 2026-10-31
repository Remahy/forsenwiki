<script>
	import {
		$isTextNode as isTextNode,
		IS_BOLD,
		IS_ITALIC,
		IS_SUBSCRIPT,
		IS_SUPERSCRIPT,
	} from 'lexical';
	import { getTypeLabelForNode } from './utils';

	/**
	 * @type {{ editor: LexicalEditor, item: import('@headless-tree/core').ItemInstance<LexicalNode> }}
	 */
	const { editor, item } = $props();

	const node = $derived(item.getItemData());
	const label = $derived(item.getItemName());

	const { typeLabel, format } = $derived(
		editor.read(() => ({
			typeLabel: getTypeLabelForNode(node),
			format: isTextNode(node) ? node.getFormat() : 0,
		}))
	);

	const isBold = $derived((format & IS_BOLD) !== 0);
	const isItalic = $derived((format & IS_ITALIC) !== 0);
	const isSuperscript = $derived((format & IS_SUPERSCRIPT) !== 0);
	const isSubscript = $derived((format & IS_SUBSCRIPT) !== 0);
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
