import { LinkNode, ListNode, ListItemNode, HeadingNode, QuoteNode } from '$lib/lexical';
import { ALinkNode, ImageNode, VideoEmbedNode } from '$lib/lexicalCustom';
import { $createALinkNode } from '../plugins/Link/ALink';
import { DeprecatedVideoEmbedNode } from '../plugins/Deprecated/DeprecatedVideoEmbedNode';

const articleTheme = {
	root: 'editor-shell',
	paragraph: 'm-0',
	image: 'm-0 editor-image',
	// TODO: The 'editor-image' is for resizing capabilities, just fix the css rules instead.
	video: 'm-0 editor-image editor-video'
};

/**
 * @param {Error} error
 * @returns {void}
 */
const onErrorDefault = (error) => {
	throw error;
};

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
			},
		},
		ListNode,
		ListItemNode,
		HeadingNode,
		QuoteNode,
		ImageNode,
		VideoEmbedNode,

		// Old nodes / Migration nodes
		DeprecatedVideoEmbedNode,
	],
	/** @param {Error} error */
	onError,
	editorState,
});
