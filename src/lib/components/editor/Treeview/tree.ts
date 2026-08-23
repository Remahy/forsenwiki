import {
	createTree,
	hotkeysCoreFeature,
	selectionFeature,
	syncDataLoaderFeature,
	type FeatureImplementation,
} from '@headless-tree/core';
import {
	$createNodeSelection as createNodeSelection,
	$setSelection as setSelection,
	$getNodeByKey as getNodeByKey,
	$getNodeByKeyOrThrow as getNodeByKeyOrThrow,
	$isRootOrShadowRoot as isRootOrShadowRoot,
} from 'lexical';

import { getLabelForNode } from './utils';

declare module '@headless-tree/core' {
	export interface ItemInstance<T> {
		getParentKeys: () => string[];
	}
}

export const initTree = (editor: LexicalEditor) => {
	const parentProps: FeatureImplementation<LexicalNode> = {
		itemInstance: {
			getParentKeys: ({ item }) => editor.read(() => item.getItemData().getParentKeys()),
		},
	};

	return createTree<LexicalNode>({
		rootItemId: 'root',
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
		getItemName: (item) => editor.read(() => getNodeByKey(item.getId()) ?  getLabelForNode(item.getItemData()) : 'Unknown node'),
		isItemFolder: (item) => !!item.getChildren().length,

		features: [syncDataLoaderFeature, selectionFeature, hotkeysCoreFeature, parentProps],
	});
};
