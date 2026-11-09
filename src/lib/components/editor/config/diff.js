import {
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
	DiffATableNode,
	DiffTableRowNode,
	DiffTableCellNode,
	DiffFloatBlockNode,
	DiffGalleryNode,
} from '$lib/lexical/custom';

import { defineExtension } from '@lexical/extension';

import { articleTheme, articleNodes, htmlExport } from './article';

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
const diffConfig = (theme, editable, editorState, onError = onErrorDefault) => ({
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
		DiffHeadingNode,
		DiffListNode,
		DiffListItemNode,
		DiffImageNode,
		DiffVideoEmbedNode,
		DiffALinkNode,
		DiffLineBreakNode,
		DiffTabNode,
		DiffATableNode,
		DiffTableRowNode,
		DiffTableCellNode,
		DiffFloatBlockNode,
		DiffGalleryNode,
	],
	/** @param {Error} error */
	onError,
	editorState,
	html: {
		export: htmlExport,
	},
});

/**
 * @param {any} theme
 * @param {boolean} editable
 * @param {any} editorState
 * @param {typeof onErrorDefault} onError
 */
export const diffExtension = (theme, editable, editorState, onError = onErrorDefault) => {
	const { editorState: $initialEditorState, ...config } = diffConfig(
		theme,
		editable,
		editorState,
		onError
	);
	return defineExtension({ name: 'diff', $initialEditorState, ...config });
};
