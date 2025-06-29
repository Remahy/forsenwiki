import { VideoEmbedNode } from '$lib/lexical/custom';
import { $createVideoEmbedNode } from '../VideoEmbed/VideoEmbed';
import { addInformationHover, applyCSSColorDiff } from './utils';

/**
 * @typedef {import('lexical').NodeKey} NodeKey
 * @typedef {import('lexical').LexicalEditor} LexicalEditor
 * @typedef {import('lexical').EditorConfig} EditorConfig
 */

export class DiffVideoEmbedNode extends VideoEmbedNode {
	/** @type {import('./Types').___Change} */
	___change;

	/** @type {keyof typeof import('../../utils/elementUtils').ELEMENT_FORMAT_TO_TYPE} */
	__format = 0;

	/**
	 * @param {VideoEmbedNode} node
	 * @param {NodeKey} [key]
	 */
	constructor(node, key) {
		super(node.__platform, node.__src, node.__width, node.__height, node.getFormatType(), key);

		this.__format = node.getFormat() || 0;
		this.__platform = node.getPlatform();
		this.__src = node.getSrc();
		this.__width = node.getWidthAndHeight().width;
		this.__height = node.getWidthAndHeight().height;

		// @ts-ignore
		this.___change = node.___change;
	}

	/**
	 * @param {VideoEmbedNode} node
	 */
	static clone(node) {
		return new DiffVideoEmbedNode(node, node.__key);
	}

	static getType() {
		return 'diff-videoembed';
	}

	/**
	 * @param {import('../VideoEmbed/VideoEmbed').SerializedVideoEmbedNode} serializedNode
	 */
	static importJSON(serializedNode) {
		const node = $createVideoEmbedNode().updateFromJSON(serializedNode);

		// @ts-ignore
		node.___change = serializedNode.___change;

		return node;
	}

	exportDOM() {
		const dom = super.exportDOM();

		if (
			dom.element instanceof HTMLElement &&
			Object.prototype.hasOwnProperty.call(this.___change, '___type')
		) {
			const div = document.createElement('div');
			div.classList.add('py-4', 'pl-4', 'pr-7');
			div.appendChild(dom.element);

			applyCSSColorDiff(div, this.___change.___type);

			addInformationHover(div, this.___change);

			// We need to wrap ImageNode in a span to make sure 'relative' class works properly.
			dom.element = div;
		}

		return dom;
	}

	exportJSON() {
		return { ...super.exportJSON(), type: DiffVideoEmbedNode.getType() };
	}

	/**
	 * @param {LexicalEditor} editor
	 * @param {EditorConfig} config
	 */
	decorate(editor, config) {
		return super.decorate(editor, config);
	}
}

// /**
//  * @param {VideoEmbedNode} node
//  */
// export function $createDiffVideoEmbedNode(node) {
// 	return new DiffVideoEmbedNode(node);
// }
