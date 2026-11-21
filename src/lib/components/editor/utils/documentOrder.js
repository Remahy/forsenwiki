import { $getBlockId } from '@lexical/extension';
import { $getRoot, $isElementNode } from 'lexical';

/**
 * Block ids in the order their blocks are in the article.
 * @param {string[]} ids
 */
export const $sortBlockIds = (ids) => {
	/** @type {Map<string, number>} */
	const order = new Map();

	/** @param {LexicalNode} node */
	const $visit = (node) => {
		const id = $getBlockId(node);
		if (id !== null) {
			order.set(id, order.size);
		}

		if ($isElementNode(node)) {
			node.getChildren().forEach($visit);
		}
	};
	$getRoot().getChildren().forEach($visit);

	return [...ids].sort((a, b) => (order.get(a) ?? Infinity) - (order.get(b) ?? Infinity));
};

/**
 * @param {LexicalEditor} editor
 * @param {string[]} ids
 */
export const sortBlockIds = (editor, ids) => editor.read(() => $sortBlockIds(ids));
