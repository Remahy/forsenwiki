<script>
	import { getEditor } from 'svelte-lexical';
	import { ChevronDownIcon, ChevronRightIcon } from '@lucide/svelte';

	import './treeview.css';
	import { treeviewState } from './treeviewState.svelte';
	import ItemIcon from './ItemIcon.svelte';
	import ItemName from './ItemName.svelte';
	import { handleOnClickTreeNode, updateItems } from './utils';

	/**
	 * @type {{ class?: string }}
	 */
	let { class: className = '' } = $props();

	/**
	 * @typedef {import('@headless-tree/core').ItemInstance<LexicalNode>} ItemInstance
	 */

	const editor = $state(getEditor());

	/** @type {HTMLDivElement | null} */
	let treeviewElement = $state(null);

	/**
	 * @param {MouseEvent} _
	 * @param {ItemInstance} item
	 */
	const onClickExpandNode = (_, item) => {
		item.isExpanded() ? item.collapse() : item.expand();
		updateItems(treeviewState);
	};

	$effect(() => {
		if (!treeviewState.tree) {
			return;
		}

		treeviewState.tree.setMounted(true);
		treeviewState.tree.registerElement(treeviewElement);

		treeviewState.tree.rebuildTree();

		updateItems(treeviewState);

		return () => {
			treeviewState.tree?.setMounted(false);
		};
	});
</script>

{#if editor}
	<div
		bind:this={treeviewElement}
		{...treeviewState.tree?.getContainerProps?.('Tree') ?? {}}
		class="tree grow overflow-y-auto p-2 {className}"
	>
		{#each treeviewState.items as item (item.getId())}
			<div
				{...item.getProps()}
				class="item"
				class:selected={item.isSelected()}
				class:focused={item.isFocused()}
				style={`margin-left: ${item.getItemMeta().level * 24}px`}
				data-id={item.getId()}
			>
				{#if item.isFolder()}
					<button type="button" onclick={(e) => onClickExpandNode(e, item)}>
						{#if item.isExpanded()}
							<ChevronDownIcon size="16" />
						{:else}
							<ChevronRightIcon size="16" />
						{/if}
					</button>
				{/if}

				<button
					class="name"
					onclick={(e) => {
						e.stopPropagation();
						e.preventDefault();
						handleOnClickTreeNode(treeviewState, editor, item);
					}}
				>
					<ItemIcon {editor} {item} />
					<ItemName {editor} {item} />
				</button>
			</div>
		{/each}
	</div>
{/if}
