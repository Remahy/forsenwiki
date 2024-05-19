import { ALinkNode, LinkNode, ListNode, ListItemNode, HeadingNode, QuoteNode, ImageNode } from '$lib/lexical';
import { $createALinkNode } from '../plugins/ALink';

const articleTheme = {
	root: 'editor-shell',
	paragraph: 'm-0',
	image: 'm-0 editor-image',
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
export const articleConfig = (theme, editable, editorState, onError = onErrorDefault) => ({
	theme: theme || articleTheme,
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
		QuoteNode,
		ImageNode,
	],
	/** @param {Error} error */
	onError,
	editorState
});
