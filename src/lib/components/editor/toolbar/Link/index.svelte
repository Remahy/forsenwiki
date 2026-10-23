<script>
	import { $setSelection as setSelection, $getSelection as getSelection } from 'lexical';
	import { $toggleLink as toggleLink } from '@lexical/link';
	import { getEditor } from 'svelte-lexical';
	import { UnlinkIcon } from '@lucide/svelte';
	import Button from '$lib/components/Button.svelte';
	import { $isALinkNode as isALinkNode } from '$lib/lexical/custom';
	import Wrapper from '../components/Wrapper.svelte';
	import Title from '../components/Title.svelte';
	import EditLink from './EditLink.svelte';

	/**
	 * @type {{ selectedNode: LexicalNode | null }}
	 */
	let { selectedNode = null } = $props();

	/** @type {import('$lib/lexical/custom').ALinkNode | undefined} */
	let selectedLink = $state();

	const editor = $derived(getEditor());

	/**
	 * @param {import('$lib/lexical/custom').ALinkNode} linkNode
	 */
	const onClickUnlink = (linkNode) => {
		editor.update(() => {
			if (isALinkNode(linkNode)) {
				const currentSelection = getSelection();

				if (selectedNode !== selectedLink) {
					linkNode.select();
				}

				toggleLink(null);

				setSelection(currentSelection);
			}
		});
	};

	const updateToolbar = () => {
		editor.read(() => {
			if (!selectedNode) {
				selectedLink = undefined;
				return;
			}

			if (!selectedNode.isAttached()) {
				return;
			}

			if (isALinkNode(selectedNode)) {
				selectedLink = selectedNode;
				return;
			}

			const parents = selectedNode.getParents();

			const closestALinkNodeIndex = parents.findIndex((node) => isALinkNode(node));
			if (closestALinkNodeIndex === -1) {
				selectedLink = undefined;
				return;
			}

			if (closestALinkNodeIndex > 1) {
				selectedLink = undefined;
				return;
			}

			const closestALinkNode = /** @type {import('$lib/lexical/custom').ALinkNode} */ (
				parents[closestALinkNodeIndex]
			);

			selectedLink = closestALinkNode;
		});
	};

	$effect(() => {
		updateToolbar();
		() => [selectedNode];
	});
</script>

{#if selectedLink && isALinkNode(selectedLink)}
	<Wrapper>
		{#snippet title()}
			<Title selectedNode={selectedLink} text="Link">
				<Button
					class="m-0! rounded-none! p-0! hover:bg-violet-500!"
					onclick={() => onClickUnlink(selectedLink)}
					title="Unlink"
				>
					<UnlinkIcon />
				</Button>
			</Title>
		{/snippet}

		{#snippet content()}
			<div class="p-2">
				<EditLink selectedNode={selectedLink} />
			</div>
		{/snippet}
	</Wrapper>
{/if}
