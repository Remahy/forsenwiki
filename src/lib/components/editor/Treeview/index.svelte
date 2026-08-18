<script>
	import { onMount } from 'svelte';
	import {
		$createNodeSelection as createNodeSelection,
		$setSelection as setSelection,
		$getSelection as getSelection,
		$isParagraphNode as isParagraphNode,
		$isTextNode as isTextNode,
		$isRangeSelection as isRangeSelection,
		mergeRegister,
	} from 'lexical';
	import { getEditor } from 'svelte-lexical';
	import { ChevronDownIcon, ChevronRightIcon } from '@lucide/svelte';

	import { useDebounce } from '$lib/utils/debouncer';

	import './treeview.css';
	import { treeviewState } from './treeviewState.svelte';
	import { initTree } from './tree';
	import NodeIcon from './NodeIcon.svelte';
	import { expandParents } from './utils';
	import NameWrapper from './NameWrapper.svelte';

	/**
	 * @typedef {import('@headless-tree/core').ItemInstance<LexicalNode>} ItemInstance
	 */

	let tree = $derived(treeviewState.tree);

	const editor = $state(getEditor?.());

	/** @type {HTMLDivElement | null} */
	let treeElement = $state(null);

	/** @type {ItemInstance[]} */
	let items = $state([]);

	let isJustSelection = $state(false);

	function updateItems() {
		if (!tree) {
			return;
		}

		items = tree.getItems();
	}

	/**
	 * @param {MouseEvent} e
	 * @param {ItemInstance} item
	 */
	const onClickNode = (e, item) => {
		e.preventDefault();
		e.stopPropagation();

		isJustSelection = true;

		const node = item.getItemData();

		tree?.setSelectedItems([item.getId()]);

		updateItems();

		editor._rootElement?.focus({ preventScroll: true });

		editor.update(
			() => {
				if (isParagraphNode(node) || isTextNode(node)) {
					node.selectEnd();
				} else {
					const selection = createNodeSelection();
					selection.add(node.getKey());
					setSelection(selection);
				}

				const element = editor.getElementByKey(node.getKey());
				element?.scrollIntoView({
					behavior: 'instant',
					block: 'center',
					inline: 'center',
				});

				treeviewState.selected = node;
			},
			{ discrete: true }
		);

		isJustSelection = false;
	};

	/**
	 * @param {MouseEvent} _
	 * @param {ItemInstance} item
	 */
	const onClickExpandNode = (_, item) => {
		item.isExpanded() ? item.collapse() : item.expand();
		updateItems();
	};

	onMount(() => {
		tree = initTree(editor);

		const debouncer = useDebounce(
			/**
			 * @param {boolean} shouldUpdateTree
			 */
			(shouldUpdateTree) => {
				editor.read(() => {
					if (!tree) {
						return;
					}

					if (shouldUpdateTree) {
						tree.rebuildTree();
					}

					const selection = getSelection();

					if (!selection || (isRangeSelection(selection) && !selection?.isCollapsed())) {
						updateItems();

						tree.setSelectedItems([]);

						treeviewState.selected = null;
						return;
					}

					const [node] = selection.getNodes();
					const key = node.getKey();

					tree.setSelectedItems([key]);
					const selectedItems = tree.getSelectedItems();

					if (selectedItems.length === 1) {
						const item = selectedItems[0];
						expandParents(tree, item);

						requestAnimationFrame(() => {
							const id = item.getId();

							/** @type {HTMLDivElement | undefined | null} */
							const element = treeElement?.querySelector(`[data-id="${id}"]`);

							if (element) {
								treeElement?.scrollTo({
									top: element.offsetTop - treeElement.offsetTop,
								});
							}
						});
					}

					treeviewState.selected = node;

					updateItems();
				});
			},
			100,
			1000
		);

		const unregister = mergeRegister(
			editor.registerUpdateListener((payload) => {
				const shouldUpdateTree = payload.mutatedNodes?.size;

				if (!isJustSelection) {
					debouncer(!!shouldUpdateTree);
				}
			})
		);

		tree.setMounted(true);
		tree.registerElement(treeElement);

		tree.rebuildTree();

		updateItems();

		return () => {
			unregister();
			tree?.setMounted(false);
		};
	});
</script>

{#if editor}
	<div
		bind:this={treeElement}
		{...tree?.getContainerProps?.('Tree') ?? {}}
		class="tree grow overflow-y-auto p-2"
	>
		{#each items as item (item.getId())}
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

				<button class="name" onclick={(e) => onClickNode(e, item)}>
					<NodeIcon {editor} node={item.getItemData()} />
					<NameWrapper {editor} node={item.getItemData()}>
						{item.getItemName()}
					</NameWrapper>
				</button>
			</div>
		{/each}
	</div>
{/if}
