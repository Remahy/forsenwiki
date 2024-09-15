import { LinkNode, ListNode, ListItemNode, HeadingNode, QuoteNode } from '$lib/lexical';
import {
	ALinkNode,
	ImageNode,
	VideoEmbedNode,
	DiffTextNode,
	DiffParagraphNode,
	DiffQuoteNode,
	DiffHeadingNode,
	DiffListNode,
	DiffListItemNode,
	FallbackNode,
	DeprecatedVideoEmbedNode,
	DiffImageNode,
	DiffVideoEmbedNode,
} from '$lib/lexicalCustom';
import { $createALinkNode } from '../plugins/Link/ALink';

import { articleTheme } from './article';

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
		DiffHeadingNode,
		DiffListNode,
		DiffListItemNode,
		DiffImageNode,
		DiffVideoEmbedNode,

		// Old nodes / Migration nodes
		FallbackNode,
		DeprecatedVideoEmbedNode,
	],
	/** @param {Error} error */
	onError,
	editorState,
});
