/**
 * @typedef {import("./utils").TreeNode} TreeNode
 */

/**
 * @type {{ tree: TreeNode[], selected: import("@keenmate/svelte-treeview").LTreeNode<TreeNode> | null }}
 */
export const treeviewState = $state({
	tree: [],
	selected: null,
});
