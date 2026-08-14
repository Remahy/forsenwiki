<script>
	import { blockTypeIcons } from "$lib/constants/blockTypeIcons";
	import { getTypeForLNode } from "./utils";

	/**
	 * @type {{ editor: LexicalEditor, node: LexicalNode }}
	 */
	const { editor, node } = $props();

	// @ts-ignore
	const Icon = $derived(editor.read(() => blockTypeIcons[getTypeForLNode(node)]));
</script>

<Icon />
