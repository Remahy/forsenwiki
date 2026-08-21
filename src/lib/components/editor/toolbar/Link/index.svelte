<script>
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

	const editor = $derived(getEditor());

	const onClickUnlink = () => {
		editor.update(() => {
			if (isALinkNode(selectedNode)) {
				selectedNode.selectEnd();
				toggleLink(null);
			}
		});
	};
</script>

{#if isALinkNode(selectedNode)}
	<Wrapper>
		{#snippet title()}
			<Title {selectedNode} text="Link">
				<Button class="m-0! rounded-none! p-0!" onclick={onClickUnlink} title="Unlink">
					<UnlinkIcon />
				</Button>
			</Title>
		{/snippet}

		{#snippet content()}
			<div class="p-2">
				<EditLink {selectedNode} />
			</div>
		{/snippet}
	</Wrapper>
{/if}
