import {
	DiffAHeadingNode,
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
	DiffTableNode,
	DiffTableRowNode,
	DiffATableCellNode,
	DiffFloatBlockNode,
} from '$lib/lexical/custom';

import { articleTheme, articleNodes } from './article';

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
		// Default article nodes.
		...articleNodes,

		// Diff nodes.
		DiffTextNode,
		DiffParagraphNode,
		DiffQuoteNode,
		DiffAHeadingNode,
		DiffListNode,
		DiffListItemNode,
		DiffImageNode,
		DiffVideoEmbedNode,
		DiffALinkNode,
		DiffLineBreakNode,
		DiffTabNode,
		DiffTableNode,
		DiffTableRowNode,
		DiffATableCellNode,
		DiffFloatBlockNode,
	],
	/** @param {Error} error */
	onError,
	editorState,
});
