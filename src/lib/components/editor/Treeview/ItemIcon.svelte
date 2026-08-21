<script>
	import { getIconForLNode } from './utils';

	/**
	 * @type {{ editor: LexicalEditor, item: import('@headless-tree/core').ItemInstance<LexicalNode> }}
	 */
	const { editor, item } = $props();

	const node = $derived(item.getItemData());

	const Icon = $derived(editor.read(() => getIconForLNode(node)));
</script>

<Icon />
