<script>
	import { onMount } from 'svelte';
	import { getEditor } from 'svelte-lexical';
	import {
		$getSelection as getSelection,
		$isRangeSelection as isRangeSelection,
		mergeRegister,
	} from 'lexical';
	import { useDebounce } from '$lib/utils/debouncer';

	import { treeviewState } from './treeviewState.svelte';
	import { initTree } from './tree';
	import { expandParents, hasTreeStructureChanged, updateItems } from './utils';

	const editor = $state(getEditor());

	onMount(() => {
		treeviewState.tree = initTree(editor);

		// Kept outside the debouncer, since it only sees the arguments of the last call.
		let shouldUpdateTree = false;

		const updateTreeDebouncer = useDebounce(
			/**
			 * @param {BaseSelection | null} selection
			 */
			(selection) => {
				editor.read(() => {
					if (!treeviewState.tree) {
						return;
					}

					const treeviewElement = treeviewState.tree.getElement();

					if (shouldUpdateTree) {
						treeviewState.tree.rebuildTree();
						shouldUpdateTree = false;
					}

					if (!selection || (isRangeSelection(selection) && !selection?.isCollapsed())) {
						updateItems(treeviewState);

						treeviewState.tree.setSelectedItems([]);

						treeviewState.selected = null;
						return;
					}

					const [node] = selection.getNodes();
					const key = node.getKey();

					treeviewState.tree.setSelectedItems([key]);
					const selectedItems = treeviewState.tree.getSelectedItems();

					if (selectedItems.length === 1) {
						const item = selectedItems[0];
						expandParents(treeviewState.tree, item);

						requestAnimationFrame(() => {
							const id = item.getId();

							/** @type {HTMLDivElement | undefined | null} */
							const element = treeviewElement?.querySelector(`[data-id="${id}"]`);

							if (element && treeviewElement) {
								treeviewElement.scrollTo({
									top: element.offsetTop - treeviewElement.offsetTop,
								});
							}
						});
					}

					treeviewState.selected = node;

					updateItems(treeviewState);
				});
			},
			100,
			1000
		);

		const unregister = mergeRegister(
			editor.registerUpdateListener((payload) => {
				shouldUpdateTree ||= hasTreeStructureChanged(payload.prevEditorState, payload.editorState);

				if (!treeviewState.isTreeNodeSelection) {
					const selection = payload.editorState.read(() => getSelection());

					updateTreeDebouncer(selection);
				}
			})
		);

		return () => {
			unregister();
		};
	});
</script>
