/**
 * @typedef {LexicalNode | null} Selected
 * @typedef {import('@headless-tree/core').ItemInstance<LexicalNode>[] | null} Items
 * @typedef {import('@headless-tree/core').TreeInstance<LexicalNode> | null} Tree
 * @typedef {boolean} IsTreeNodeSelection
 */

/**
 * @type {{ tree: Tree, items: Items, selected: Selected, isTreeNodeSelection: IsTreeNodeSelection }}
 */
export const treeviewState = $state({
	tree: null,
	items: null,
	selected: null,
	isTreeNodeSelection: false,
});
