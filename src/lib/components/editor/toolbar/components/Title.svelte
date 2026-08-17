<script>
	import { getEditor } from 'svelte-lexical';
	import { Trash2Icon } from '@lucide/svelte';
	import Button from '$lib/components/Button.svelte';

	/**
	 * @type {{ selectedNode: LexicalNode, text: string, children?: import('svelte').Snippet }}
	 */
	let { selectedNode, text, children } = $props();

	const editor = $derived(getEditor());

	const onClickDelete = () => {
		editor.update(() => {
			selectedNode.remove();
		});
	};
</script>

<div class="violet flex items-center font-mono leading-none" title={text}>
	<span class="grow pl-2 select-none">{text}</span>
	{@render children?.()}
	<Button
		class="m-0! rounded-none! bg-red-400! p-0! hover:bg-red-600! dark:bg-red-600/50! dark:hover:bg-red-700!"
		onclick={onClickDelete}
		title="Delete node"
	>
		<Trash2Icon />
	</Button>
</div>
