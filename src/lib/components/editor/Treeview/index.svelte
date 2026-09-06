<script>
	import { onMount } from 'svelte';
	import { getEditor } from 'svelte-lexical';
	import { ChevronDownIcon, ChevronRightIcon } from '@lucide/svelte';

	import './treeview.css';
	import { treeviewState } from './treeviewState.svelte';
	import ItemIcon from './ItemIcon.svelte';
	import ItemName from './ItemName.svelte';
	import { handleOnClickTreeNode, styleObjectToString, updateItems } from './utils';

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

	onMount(() => {
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

{#if editor && treeviewState.tree}
	{@const { onDragOver, onDrop, ...restContainerProps } =
		treeviewState.tree.getContainerProps('Treeview')}
	<div
		bind:this={treeviewElement}
		{...restContainerProps}
		ondragover={onDragOver}
		ondrop={onDrop}
		class="tree grow overflow-y-auto p-2 relative {className}"
	>
		{#each treeviewState.items as item (item.getId())}
			{@const { onDragEnter, onDragLeave, onDragOver, onDrop, ...restProps } =
				item.getProps()}
			{@const { draggable, onDragStart, onDragEnd, ...restDragHandleProps } =
				item.getDragHandleProps()}
			<div
				{...restProps}
				ondragenter={onDragEnter}
				ondragleave={onDragLeave}
				ondragover={onDragOver}
				ondrop={onDrop}
				class="item"
				class:selected={item.isSelected()}
				class:focused={item.isFocused()}
				style:padding-left={`${item.getItemMeta().level * 24}px`}
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
					type="button"
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

				{#if item.isDraggable()}
					<div
						{...restDragHandleProps}
						{draggable}
						ondragstart={onDragStart}
						ondragend={onDragEnd}
						class="drag-handle flex items-center"
						title="Drag handle - click and drag to move this item"
					>
						⋮
					</div>
				{/if}
			</div>
		{/each}

		<div class="dragline" style={styleObjectToString(treeviewState.tree.getDragLineStyle())}></div>
	</div>
{/if}
