<script>
	import { onMount } from 'svelte';
	import { $getSelection as getSelection } from 'lexical';
	import { mergeRegister } from '@lexical/utils';
	import { getEditor } from 'svelte-lexical';

	import Divider from '$lib/components/Divider.svelte';
	import { $isFloatBlockNode as isFloatBlockNode } from '$lib/lexical/custom';
	import EditFloatBlock from './EditFloatBlock.svelte';

	/** @type {import('$lib/lexical/custom').FloatBlockNode | null} */
	let selectedFloatBlockNode = $state(null);

	const editor = getEditor();

	const updateToolbar = () => {
		editor.read(() => {
			const selection = getSelection();

			if (!selection?.isCollapsed) {
				selectedFloatBlockNode = null;
				return;
			}

			const [node] = selection.getNodes();

			if (!node) {
				selectedFloatBlockNode = null;
				return;
			}

			const closestFloatBlockNode = node.getParents().find((node) => isFloatBlockNode(node));

			if (!closestFloatBlockNode) {
				selectedFloatBlockNode = null;
				return;
			}

			selectedFloatBlockNode = closestFloatBlockNode;
		});
	};

	onMount(() => {
		return mergeRegister(
			editor.registerUpdateListener(() => {
				updateToolbar();
			})
		);
	});
</script>

{#if selectedFloatBlockNode}
	<Divider />

	<div class="flex select-none flex-col items-center justify-center font-mono text-xs leading-none" title="Float Block">
		<span>F</span>
		<span>L</span>
		<span>T</span>
	</div>

	<EditFloatBlock {selectedFloatBlockNode} />
{/if}
