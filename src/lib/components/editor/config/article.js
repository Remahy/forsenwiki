import {
	LinkNode,
	ListNode,
	ListItemNode,
	HeadingNode,
	QuoteNode,
	TableNode,
	TableCellNode,
	TableRowNode,
} from '$lib/lexical/index';
import {
	ALinkNode,
	$createALinkNode,
	DeprecatedVideoEmbedNode,
	FallbackNode,
	ImageNode,
	VideoEmbedNode,
	FloatBlockNode,
} from '$lib/lexical/custom';
import HeadingNodeDOMExport from './htmlExport/HeadingNodeDOMExport';
import TableCellNodeDOMExport from './htmlExport/TableCellNodeDOMExport';

export const articleTheme = {
	image: 'image',
	heading: {
		h1: 'break-words',
		h2: 'break-words',
		h3: 'break-words',
		h4: 'break-words',
		h5: 'break-words',
	},
	floatResponsive: 'max-sm:!float-none',
};

export const editableTheme = {
	...articleTheme,
	root: 'editor-shell',
	image: 'image editor-image',
	tableCell: 'tableCell',
	tableCellResizer: 'tableCellResizer',
	tableCellSelected: 'tableCellSelected',
	floatBlockNodeBoxShadow: '#696969 0px 0px 0px 1px',
	floatResponsive: null,
	text: {
		bold: 'font-semibold',
		italic: 'italic',
	},
};

export const htmlExport =  new Map([HeadingNodeDOMExport, TableCellNodeDOMExport]);

/**
 * @param {Error} error
 * @returns {void}
 */
const onErrorDefault = (error) => {
	throw error;
};

export const articleNodes = [
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

	ListNode,
	ListItemNode,

	HeadingNode,
	QuoteNode,
	ImageNode,
	VideoEmbedNode,
	TableNode,
	TableCellNode,
	TableRowNode,
	FloatBlockNode,

	// Old nodes / Migration nodes
	FallbackNode,
	DeprecatedVideoEmbedNode,
];

/**
 * @param {any} theme
 * @param {boolean} editable
 * @param {any} editorState
 * @param {typeof onErrorDefault} onError
 * @returns {import('lexical').CreateEditorArgs}
 */
export const articleConfig = (theme, editable, editorState, onError = onErrorDefault) => ({
	theme: theme || articleTheme,
	namespace: 'editor',
	editable,
	nodes: articleNodes,
	/** @param {Error} error */
	onError,
	editorState,
	html: {
		export: htmlExport,
	},
});
