/**
 * @type {{ tree: import('@headless-tree/core').TreeInstance<LexicalNode> | null, selected: LexicalNode | null }}
 */
export const treeviewState = $state({
	tree: null,
	selected: null,
});
