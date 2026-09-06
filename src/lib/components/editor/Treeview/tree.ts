import {
	createTree,
	dragAndDropFeature,
	hotkeysCoreFeature,
	keyboardDragAndDropFeature,
	selectionFeature,
	syncDataLoaderFeature,
	type DragTarget,
	type FeatureImplementation,
} from '@headless-tree/core';
import {
	$isElementNode as isElementNode,
	$getNodeByKey as getNodeByKey,
	$getNodeByKeyOrThrow as getNodeByKeyOrThrow,
} from 'lexical';

import {
	$isImageNode as isImageNode,
	$isVideoEmbedNode as isVideoEmbedNode,
	$isGalleryNode as isGalleryNode,
} from '$lib/lexical/custom';
import { getLabelForNode } from './utils';

declare module '@headless-tree/core' {
	export interface ItemInstance<T> {
		getParentKeys: () => string[];
		isDraggable: () => boolean;
		acceptableDropParents: () => Function[];
	}
}

export const initTree = (editor: LexicalEditor) => {
	const parentProps: FeatureImplementation<LexicalNode> = {
		key: 'fwiki-parent-props',
		itemInstance: {
			getParentKeys: ({ item }) => editor.read(() => item.getItemData().getParentKeys()),
		},
	};

	const draggableProps: FeatureImplementation<LexicalNode> = {
		key: 'fwiki-draggable-props',
		itemInstance: {
			isDraggable: ({ item }) =>
				editor.read(() => {
					return isGalleryNode(item.getParent()?.getItemData());
				}),

			acceptableDropParents: ({ item }) =>
				editor.read(() => {
					const node = item.getItemData();

					if (isVideoEmbedNode(node) || isImageNode(node)) {
						return [isGalleryNode];
					}

					return [];
				}),
		},
	};

	return createTree<LexicalNode>({
		rootItemId: 'root',
		indent: 24,
		seperateDragHandle: true,

		dataLoader: {
			getItem: (itemId) => editor.read(() => getNodeByKeyOrThrow(itemId)),
			getChildren: (itemId) =>
				editor.read(() => {
					const node = getNodeByKey(itemId);

					if (!node) {
						console.error('createTree: Could not find node by key.');
						return [];
					}

					if ('getChildrenKeys' in node && typeof node.getChildrenKeys === 'function') {
						return node.getChildrenKeys();
					}

					return [];
				}),
		},
		getItemName: (item) =>
			editor.read(() =>
				getNodeByKey(item.getId()) ? getLabelForNode(item.getItemData()) : 'Unknown node'
			),
		isItemFolder: (item) => !!item.getChildren().length,

		canDrag: (items) => items.every((item) => item.isDraggable()),
		canDrop: (items, target) => {
			for (let index = 0; index < items.length; index++) {
				const item = items[index];
				const acceptableParents = item.acceptableDropParents();

				if (!acceptableParents.find((fn) => fn(target.item.getItemData()))) {
					return false;
				}
			}

			return true;
		},
		onDrop: (items, target) => {
			const [item] = items;

			const targetInfo: DragTarget<LexicalNode> & {
				childIndex: number;
				dragLineIndex: number;
				dragLineLevel: number;
				insertionIndex: number;
			} = target as any;

			return editor.update(() => {
				const node = getNodeByKey(item.getKey());
				const parentNode = getNodeByKey(target.item.getKey());
				if (!node || !parentNode) {
					return;
				}

				if (!isElementNode(parentNode)) {
					return;
				}

				const targetNode = parentNode.getChildAtIndex(targetInfo.insertionIndex - 1);

				if (!targetNode) {
					// Shove at end.
					parentNode.append(node);
					return;
				}

				targetNode.insertBefore(node);
			});
		},

		features: [
			syncDataLoaderFeature,
			selectionFeature,
			hotkeysCoreFeature,
			dragAndDropFeature,
			keyboardDragAndDropFeature,
			parentProps,
			draggableProps,
		],
	});
};
