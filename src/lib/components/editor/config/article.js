import {
	LinkNode,
	ListNode,
	ListItemNode,
	HeadingNode,
	QuoteNode,
	TableCellNode,
	TableRowNode,
	TableNode,
} from '$lib/lexical/index';
import {
	ALinkNode,
	$createALinkNode,
	DeprecatedVideoEmbedNode,
	FallbackNode,
	ImageNode,
	VideoEmbedNode,
	FloatBlockNode,
	AHeadingNode,
	ATableCellNode,
	ATableNode,
	$createATableNode,
} from '$lib/lexical/custom';
import HeadingNodeDOMExport from './htmlExport/HeadingNodeDOMExport';
import TableCellNodeDOMExport from './htmlExport/TableCellNodeDOMExport';
import TableNodeDOMExport from './htmlExport/TableNodeDOMExport';

const floatResponsive = 'max-sm:float-none! max-sm:w-full! max-sm:me-0! max-sm:ms-0!';
const floatBoxShadow = '0px 0px 0px 1px #696969';

export const articleTheme = {
	image: 'image',
	heading: {
		h1: 'wrap-break-word',
		h2: 'wrap-break-word',
		h3: 'wrap-break-word',
		h4: 'wrap-break-word',
		h5: 'wrap-break-word',
	},
	floatBoxShadow,
	floatResponsive: `${floatResponsive} [&_p:has(>br:only-child)]:hidden`,
	tableCell: 'tableCell',
};

export const editableTheme = {
	...articleTheme,
	root: 'editor-shell',
	image: 'image editor-image',
	tableCellResizer: 'tableCellResizer',
	tableCellSelected: 'tableCellSelected',
	floatBoxShadowEditable: '0px 0px 4px #696969',
	floatResponsive,
	text: {
		bold: 'font-semibold',
		italic: 'italic',
	},
};

export const htmlExport = new Map([
	HeadingNodeDOMExport,
	TableCellNodeDOMExport,
	TableNodeDOMExport,
]);

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
				false,
				undefined
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

	ATableNode,
	{
		replace: TableNode,
		with: () => $createATableNode(),
		withKlass: ATableNode,
	},
	TableCellNode,
	TableRowNode,
	FloatBlockNode,

	// Old nodes / Migration nodes
	FallbackNode,
	DeprecatedVideoEmbedNode,
	AHeadingNode,
	ATableCellNode,
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
