import {
	$createNodeSelection,
	$getSelection,
	$isParagraphNode,
	$isRangeSelection,
	$isTextNode,
	$setSelection,
} from 'lexical';
import { defineExtension, signal } from '@lexical/extension';

import { useDebounce } from '$lib/utils/debouncer';
import { focusEditor } from '../utils/focusEditor';
import { initTree } from './tree';
import { expandParents, hasTreeStructureChanged } from './utils';

/**
 * @typedef {import('@headless-tree/core').ItemInstance<LexicalNode>} ItemInstance
 * @typedef {{ debounceMs: number, maxWaitMs: number }} TreeviewConfig
 */

export const TreeviewExtension = defineExtension({
	name: 'article/treeview',
	config: /** @type {TreeviewConfig} */ ({ debounceMs: 100, maxWaitMs: 1000 }),
	init: () => ({ isTreeNodeSelection: false }),
	build: (editor, _config, state) => {
		const tree = initTree(editor);
		const items = signal(/** @type {ItemInstance[]} */ ([]));
		const selected = signal(/** @type {LexicalNode | null} */ (null));
		const flag = state.getInitResult();

		const updateItems = () => {
			items.value = [...tree.getItems()];
		};

		/** @param {ItemInstance} item */
		const toggleExpanded = (item) => {
			if (item.isExpanded()) {
				item.collapse();
			} else {
				item.expand();
			}
			updateItems();
		};

		/** @param {ItemInstance} item */
		const selectItem = (item) => {
			flag.isTreeNodeSelection = true;

			const node = item.getItemData();

			tree.setSelectedItems([item.getId()]);
			updateItems();

			focusEditor(editor);

			editor.update(
				() => {
					if ($isParagraphNode(node) || $isTextNode(node)) {
						node.selectEnd();
					} else {
						const selection = $createNodeSelection();
						selection.add(node.getKey());
						$setSelection(selection);
					}

					editor.getElementByKey(node.getKey())?.scrollIntoView({
						behavior: 'instant',
						block: 'center',
						inline: 'center',
					});

					selected.value = node;
				},
				{ discrete: true }
			);

			flag.isTreeNodeSelection = false;
		};

		return { tree, items, selected, updateItems, toggleExpanded, selectItem };
	},
	register: (editor, { debounceMs, maxWaitMs }, state) => {
		const { tree, selected, updateItems } = state.getOutput();
		const flag = state.getInitResult();

		// Kept outside the debouncer, since it only sees the arguments of the last call.
		let shouldUpdateTree = false;

		/** @param {BaseSelection | null} selection */
		const syncSelection = (selection) => {
			editor.read(() => {
				const treeviewElement = tree.getElement();

				if (shouldUpdateTree) {
					tree.rebuildTree();
					shouldUpdateTree = false;
				}

				if (!selection || ($isRangeSelection(selection) && !selection.isCollapsed())) {
					updateItems();
					tree.setSelectedItems([]);
					selected.value = null;
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
						/** @type {HTMLDivElement | undefined | null} */
						const element = treeviewElement?.querySelector(`[data-id="${item.getId()}"]`);

						if (element && treeviewElement) {
							treeviewElement.scrollTo({
								top: element.offsetTop - treeviewElement.offsetTop,
							});
						}
					});
				}

				selected.value = node;
				updateItems();
			});
		};

		const sync = /** @type {import('lodash').DebouncedFunc<typeof syncSelection>} */ (
			useDebounce(syncSelection, debounceMs, maxWaitMs)
		);

		const unregister = editor.registerUpdateListener((payload) => {
			shouldUpdateTree ||= hasTreeStructureChanged(payload.prevEditorState, payload.editorState);

			if (!flag.isTreeNodeSelection) {
				sync(payload.editorState.read(() => $getSelection()));
			}
		});

		return () => {
			sync.cancel();
			unregister();
		};
	},
});
