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
	GalleryNode,
} from '$lib/lexical/custom';
import isUrl from 'is-url';
import { BlockIdExtension, configExtension, defineExtension } from '@lexical/extension';
import { LinkExtension } from '@lexical/link';
import { ListExtension } from '@lexical/list';
import { RichTextExtension } from '@lexical/rich-text';
import { TableExtension } from '@lexical/table';
import { GalleryExtension } from '../plugins/Gallery/GalleryExtension';
import HeadingNodeDOMExport from './htmlExport/HeadingNodeDOMExport';
import TableCellNodeDOMExport from './htmlExport/TableCellNodeDOMExport';
import TableNodeDOMExport from './htmlExport/TableNodeDOMExport';
import GalleryNodeDOMExport from './htmlExport/GalleryNodeDOMExport';
import { logYWarning } from '$lib/y/config';

const floatResponsive = 'max-lg:float-none! max-lg:w-full! max-lg:me-0! max-lg:ms-0!';
const floatBoxShadow = '0px 0px 0px 1px #696969';

/**
 * @type {import('lexical').EditorThemeClasses}
 */
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
	list: {
		ul: 'overflow-hidden',
		ol: 'overflow-hidden',
	},
	quote: 'overflow-hidden',
};

/**
 * @type {import('lexical').EditorThemeClasses}
 */
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
	link: 'pointer-events-none',
};

export const htmlExport = new Map([
	HeadingNodeDOMExport,
	TableCellNodeDOMExport,
	TableNodeDOMExport,
	GalleryNodeDOMExport,
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

	GalleryNode,

	// Old nodes / Migration nodes
	FallbackNode,
	DeprecatedVideoEmbedNode,
	AHeadingNode,
	ATableCellNode,
];

/**
 * @typedef {{ onWarn?: import('lexical').CreateEditorArgs['onWarn'], htmlExport?: Map<any, any> }} ArticleOptions
 */

/**
 * @param {any} theme
 * @param {boolean} editable
 * @param {any} editorState
 * @param {typeof onErrorDefault} onError
 * @param {ArticleOptions} [options]
 * @returns {import('lexical').CreateEditorArgs}
 */
const articleConfig = (theme, editable, editorState, onError = onErrorDefault, options = {}) => ({
	theme: theme || articleTheme,
	namespace: 'editor',
	editable,
	nodes: articleNodes,
	/** @param {Error} error */
	onError,
	onWarn: options.onWarn ?? logYWarning,
	editorState,
	html: {
		export: options.htmlExport ?? htmlExport,
	},
});

/**
 * @param {any} theme
 * @param {boolean} editable
 * @param {any} editorState
 * @param {typeof onErrorDefault} [onError]
 * @param {ArticleOptions} [options]
 */
export const articleExtension = (
	theme,
	editable,
	editorState,
	onError = onErrorDefault,
	options
) => {
	const { editorState: $initialEditorState, ...config } = articleConfig(
		theme,
		editable,
		editorState,
		onError,
		options
	);
	return defineExtension({
		name: 'article',
		dependencies: [
			RichTextExtension,
			ListExtension,
			configExtension(LinkExtension, { validateUrl: isUrl }),
			configExtension(TableExtension, {
				hasCellMerge: false,
				hasCellBackgroundColor: false,
				hasHorizontalScroll: false,
				hasNestedTables: true,
			}),
			GalleryExtension,
			BlockIdExtension,
		],
		$initialEditorState,
		...config,
	});
};
