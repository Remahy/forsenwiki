import { ALinkNode, LinkNode, ListNode, ListItemNode, HeadingNode, QuoteNode } from '$lib/lexical';
import { $createALinkNode } from '../plugins/ALink';

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
				return $createALinkNode(
					node.__url,
					{ rel: node.__rel, target: node.__target, title: node.__title },
					false
				);
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
