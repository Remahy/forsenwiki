<script>
	import { Trash2Icon } from '@lucide/svelte';
	import { getEditor } from 'svelte-lexical';
	import Button from '$lib/components/Button.svelte';

	const editor = getEditor();

	const handleClickDelete = () => {
		if (!node) {
			return;
		}

		editor.update(() => {
			node.selectStart();

			const nextSibling = node.getNextSibling();

			node.remove();

			nextSibling?.selectStart();
		});
	};

	/** @type {{ node?: undefined, onClick: () => void } | { node: LexicalNode, onClick?: undefined }} */
	const { node, onClick = handleClickDelete } = $props();
</script>

<Button
	class="m-0! rounded-none! bg-red-400! p-0! hover:bg-red-600! dark:bg-red-600/50! dark:hover:bg-red-700!"
	onclick={onClick}
	title="Delete node"
>
	<Trash2Icon />
</Button>
