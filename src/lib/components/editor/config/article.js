import { ALinkNode, LinkNode, ListNode, ListItemNode, HeadingNode, QuoteNode } from '$lib/lexical.mjs';

const articleTheme = {
	paragraph: 'm-0'
};

/** 
 * @param {Error} error
 * @returns {void}
 */
const onErrorDefault = (error) => {
	throw error;
}

/**
 * @param {any} theme
 * @param {boolean} editable
 * @param {any} editorState
 * @param {typeof onErrorDefault} onError
 */
export const articleConfig = (theme = articleTheme, editable, editorState, onError = onErrorDefault) => ({
	theme,
	namespace: 'editor',
	editable,
	nodes: [
		ALinkNode,
		{
			replace: LinkNode,
			/**
			 * @param {LinkNode} node
			 */
			with: (node) => {
				return new ALinkNode(node.getURL(), false, node.__key);
			}
		},
		ListNode,
		ListItemNode,
		HeadingNode,
		QuoteNode
	],
	/** @param {Error} error */
	onError,
	editorState
});
