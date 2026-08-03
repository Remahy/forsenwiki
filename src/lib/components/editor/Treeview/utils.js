import { $isTextNode as isTextNode, $getRoot as getRoot } from 'lexical';
import { $getNearestNodeOfType as getNearestNodeOfType } from '@lexical/utils';
import { $isListNode as isListNode } from '@lexical/list';
import { $isHeadingNode as isHeadingNode } from '@lexical/rich-text';
import { ListNode } from '$lib/lexical/index';

import { blockTypeIcons } from '$lib/constants/blockTypeIcons';
import { blockTypeLabels } from '$lib/constants/element';

/**
 * @typedef {{ key: string, path: string, type: string, rawNode: LexicalNode, label: string, Icon?: import('svelte').Component<any> }} TreeNode
 */

/**
 * @param {TreeNode} node
 */
const getLabelForNode = (node) => {
	if (isTextNode(node.rawNode)) {
		const textContent = node.rawNode.getTextContent();
		return textContent.substring(0, 32);
	}

	if (isListNode(node.rawNode)) {
		const parentList = getNearestNodeOfType(node.rawNode, ListNode);
		return parentList ? parentList.getListType() : node.rawNode.getListType();
	}

	const type = isHeadingNode(node.rawNode) ? node.rawNode.getTag() : node.rawNode.getType();

	// @ts-ignore
	return blockTypeLabels[type] ?? type;
};

/**
 * @param {LexicalNode} _node
 * @param {string} path
 */
const createNodeObject = (_node, path) => {
	/** @type {TreeNode} */
	const node = {
		path,
		key: _node.getKey(),
		type: _node.getType(),
		rawNode: _node,
		label: '',
	};
	node.label = getLabelForNode(node);

	node.Icon =
		node.type in blockTypeIcons
			? /** @type {any}*/ (blockTypeIcons)[node.type]
			: blockTypeIcons.default;

	return node;
};

/**
 * @param {TreeNode[]} res
 * @param {TreeNode} parentNode
 */
const readChildren = (res, parentNode) => {
	/** @type {LexicalNode[]} */
	const children = /** @type {any} */ (parentNode.rawNode).getChildren();

	for (let index = 0; index < children.length; index++) {
		const _node = children[index];

		const node = createNodeObject(_node, `${parentNode.path}.${index + 1}`);

		res.push(node);

		if ('getChildren' in node.rawNode) {
			readChildren(res, node);
		}
	}
};

/**
 * @param {LexicalEditor} editor
 */
export const createTreeFromEditor = (editor) => {
	return editor.read(() => {
		/**
		 * @type {TreeNode[]}
		 */
		const res = [];

		const root = getRoot();
		const children = root.getChildren();

		for (let index = 0; index < children.length; index++) {
			const _node = children[index];

			/** @type {TreeNode} */
			const node = createNodeObject(_node, `${String(index + 1)}`);

			res.push(node);

			if ('getChildren' in node.rawNode) {
				readChildren(res, node);
			}
		}

		console.log(res);

		return res;
	});
};
