import { LinkNode, ListNode, ListItemNode, HeadingNode, QuoteNode } from '$lib/lexical/index';
import {
	ALinkNode,
	AHeadingNode,
	DeprecatedVideoEmbedNode,
	FallbackNode,
	ImageNode,
	VideoEmbedNode,
} from '$lib/lexical/custom';
import { $createALinkNode } from '../plugins/ALink/ALinkNode';
import { $createAHeadingNode } from '../plugins/AHeading/AHeadingNode';

export const articleTheme = {
	root: 'editor-shell',
	paragraph: 'm-0',
	image: 'm-0 editor-image',
	// TODO: The 'editor-image' is for resizing capabilities, just fix the css rules instead.
	video: 'm-0 editor-image editor-video',
	heading: {
		h1: 'break-words',
		h2: 'break-words',
		h3: 'break-words',
		h4: 'break-words',
		h5: 'break-words',
	},
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
			withKlass: ALinkNode,
		},
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
		QuoteNode,
		ImageNode,
		VideoEmbedNode,

		// Old nodes / Migration nodes
		FallbackNode,
		DeprecatedVideoEmbedNode,
	],
	/** @param {Error} error */
	onError,
	editorState,
});
