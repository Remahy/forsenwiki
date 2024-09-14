import { LinkNode, ListNode, ListItemNode, HeadingNode, QuoteNode } from '$lib/lexical';
import {
	ALinkNode,
	ImageNode,
	VideoEmbedNode,
	DeprecatedVideoEmbedNode,
	DiffTextNode,
	DiffParagraphNode,
	DiffQuoteNode,
	FallbackNode,
} from '$lib/lexicalCustom';
import { $createALinkNode } from '../plugins/Link/ALink';

const articleTheme = {
	root: 'editor-shell',
	paragraph: 'm-0',
	image: 'm-0 editor-image',
	// TODO: The 'editor-image' is for resizing capabilities, just fix the css rules instead.
	video: 'm-0 editor-image editor-video',
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
 * @returns {import('lexical').CreateEditorArgs}
 */
export const diffConfig = (theme, editable, editorState, onError = onErrorDefault) => ({
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
			withKlass: ALinkNode,
		},
		QuoteNode,
		ListNode,
		ListItemNode,
		HeadingNode,
		ImageNode,
		VideoEmbedNode,

		// Diff nodes.
		DiffTextNode,
		DiffParagraphNode,
		DiffQuoteNode,

		// Old nodes / Migration nodes
		FallbackNode,
		DeprecatedVideoEmbedNode,
	],
	/** @param {Error} error */
	onError,
	editorState,
});
