<script>
	import { getEditor } from '$lib/components/editor/context';
	import { ChevronDownIcon, ChevronRightIcon } from '@lucide/svelte';

	import './treeview.css';
	import { getExtensionDependencyFromEditor } from '@lexical/extension';
	import { fromSignal } from '$lib/utils/fromSignal.svelte';
	import { TreeviewExtension } from './TreeviewExtension';
	import ItemIcon from './ItemIcon.svelte';
	import ItemName from './ItemName.svelte';
	import { styleObjectToString } from './utils';

	/**
	 * @typedef {import('@headless-tree/core').ItemInstance<LexicalNode>} ItemInstance
	 */

	const editor = getEditor();
	const { tree, items, updateItems, toggleExpanded, selectItem } = getExtensionDependencyFromEditor(
		editor,
		TreeviewExtension
	).output;
	const treeItems = fromSignal(items);
	// Same item instances across updates would leave rows stale, so give Svelte a new identity per update.
	const rows = $derived(treeItems.current.map((item) => Object.create(item)));
	const { onDragOver, onDrop, ...restContainerProps } = tree.getContainerProps('Treeview');

	/** @type {HTMLDivElement | null} */
	let treeviewElement = $state(null);

	$effect(() => {
		tree.setMounted(true);
		tree.registerElement(treeviewElement);

		tree.rebuildTree();

		updateItems();

		return () => {
			tree.setMounted(false);
		};
	});
</script>

<div
	bind:this={treeviewElement}
	{...restContainerProps}
	ondragover={onDragOver}
	ondrop={onDrop}
	class="tree relative grow overflow-y-auto p-2"
>
	{#each rows as item (item.getId())}
		{@const { onDragEnter, onDragLeave, onDragOver, onDrop, ...restProps } = item.getProps()}
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
				<button type="button" onclick={() => toggleExpanded(item)}>
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
					selectItem(item);
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
					class="drag-handle flex items-center px-2"
					title="Drag handle - click and drag to move this item"
				>
					<span>⋮</span>
				</div>
			{/if}
		</div>
	{/each}

	<div class="dragline" style={styleObjectToString(tree.getDragLineStyle())}></div>
</div>
