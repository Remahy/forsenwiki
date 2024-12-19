import { HeadingNode, LinkNode, ListItemNode, ListNode, QuoteNode } from '$lib/lexical/index';
import {
	ALinkNode,
	DeprecatedVideoEmbedNode,
	DiffHeadingNode,
	DiffImageNode,
	DiffListItemNode,
	DiffListNode,
	DiffParagraphNode,
	DiffQuoteNode,
	DiffTextNode,
	DiffVideoEmbedNode,
	DiffALinkNode,
	DiffLineBreakNode,
	DiffTabNode,
	FallbackNode,
	ImageNode,
	VideoEmbedNode,
	AHeadingNode,
} from '$lib/lexical/custom';
import { $createALinkNode } from '../plugins/ALink/ALinkNode';
import { $createAHeadingNode } from '../plugins/AHeading/AHeadingNode';

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
	namespace: 'diff-editor',
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
		AHeadingNode,
		{
			replace: HeadingNode,
			/**
			 * @param {HeadingNode} node
			 */
			with: (node) => {
				return $createAHeadingNode(
					node.__tag,
				);
			},
			withKlass: AHeadingNode,
		},
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
		DiffALinkNode,
		DiffLineBreakNode,
		DiffTabNode,

		// Old nodes / Migration nodes
		FallbackNode,
		DeprecatedVideoEmbedNode,
	],
	/** @param {Error} error */
	onError,
	editorState,
});
