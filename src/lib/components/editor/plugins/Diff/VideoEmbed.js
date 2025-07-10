import { VideoEmbedNode } from '$lib/lexical/custom';
import { addInformationHover, applyCSSColorDiff } from './utils';

/**
 * @typedef {import('lexical').NodeKey} NodeKey
 * @typedef {import('lexical').LexicalEditor} LexicalEditor
 * @typedef {import('lexical').EditorConfig} EditorConfig
 *
 * @typedef {import('../VideoEmbed/VideoEmbed').SerializedVideoEmbedNode} SerializedVideoEmbedNode
 */

export class DiffVideoEmbedNode extends VideoEmbedNode {
	/** @type {import('./Types').___Change} */
	___change;

	/** @type {keyof typeof import('../../utils/elementUtils').ELEMENT_FORMAT_TO_TYPE} */
	__format = 0;

	/**
	 * @param {SerializedVideoEmbedNode | VideoEmbedNode} node
	 * @param {NodeKey} [key]
	 */
	constructor(node, key) {
		super(
			// @ts-ignore
			node.platform || node.__platform,
			// @ts-ignore
			node.src || node.__src,
			// @ts-ignore
			node.width ?? node.__width,
			// @ts-ignore
			node.height ?? node.__height,
			// @ts-ignore
			node.format ?? node.__format,
			key
		);
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
	 * @param {SerializedVideoEmbedNode} serializedNode
	 */
	static importJSON(serializedNode) {
		const node = $createDiffVideoEmbedNode(serializedNode).updateFromJSON(serializedNode);
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
		return { ...super.exportJSON(), ___change: this.___change, type: DiffVideoEmbedNode.getType() };
	}

	/**
	 * @param {LexicalEditor} editor
	 * @param {EditorConfig} config
	 */
	decorate(editor, config) {
		return super.decorate(editor, config);
	}
}

/**
 * @param {SerializedVideoEmbedNode} node
 */
export function $createDiffVideoEmbedNode(node) {
	return new DiffVideoEmbedNode(node);
}
