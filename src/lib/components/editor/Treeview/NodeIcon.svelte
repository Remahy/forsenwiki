<script>
	import { getIconForLNode } from './utils';

	/**
	 * @type {{ editor: LexicalEditor, node: LexicalNode }}
	 */
	const { editor, node } = $props();

	const Icon = $derived(editor.read(() => getIconForLNode(node)));
</script>

<Icon />
