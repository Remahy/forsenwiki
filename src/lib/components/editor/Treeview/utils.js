import { $isTextNode as isTextNode } from 'lexical';
import { $getNearestNodeOfType as getNearestNodeOfType } from '@lexical/utils';
import { $isListNode as isListNode } from '@lexical/list';
import { $isHeadingNode as isHeadingNode } from '@lexical/rich-text';
import { ListNode } from '$lib/lexical/index';
import { blockTypeLabels } from '$lib/constants/element';

/**
 * @param {LexicalNode} node
 */
export const getTypeForLNode = (node) => {
	if (isTextNode(node)) {
		return node.getType();
	}

	if (isListNode(node)) {
		const parentList = getNearestNodeOfType(node, ListNode);
		return parentList ? parentList.getListType() : node.getListType();
	}

	const type = isHeadingNode(node) ? node.getTag() : node.getType();

	return type;
};

/**
 * @param {LexicalNode} node
 */
export const getLabelForLNode = (node) => {
	if (isTextNode(node)) {
		const textContent = node.getTextContent();

		return textContent.substring(0, 32);
	}

	const type = getTypeForLNode(node);

	// @ts-ignore
	return blockTypeLabels[type] ?? type;
};

/**
 * @param {import('@headless-tree/core').TreeInstance<LexicalNode>} tree
 * @param {import('@headless-tree/core').ItemInstance<LexicalNode>} item
 */
export const expandParents = (tree, item) => {
	const parentKeys = item.getParentKeys().reverse();

	for (let index = 0; index < parentKeys.length; index++) {
		const key = parentKeys[index];
		tree.getItemInstance(key).expand();
	}

	item.expand();
};
