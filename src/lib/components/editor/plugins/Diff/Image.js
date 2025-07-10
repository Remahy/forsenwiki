import { ImageNode } from '$lib/lexical/custom';
import { addInformationHover, applyCSSColorDiff } from './utils';

/**
 * @typedef {import('lexical').NodeKey} NodeKey
 * @typedef {import('lexical').LexicalEditor} LexicalEditor
 * @typedef {import('lexical').EditorConfig} EditorConfig
 *
 * @typedef {import('../Image/Image').SerializedImageNode} SerializedImageNode
 */

export class DiffImageNode extends ImageNode {
	/** @type {import('./Types').___Change} */
	___change;

	/**
	 * @param {SerializedImageNode | ImageNode} node
	 * @param {NodeKey} [key]
	 */
	constructor(node, key) {
		super(
			// @ts-ignore
			node.src || node.__src,
			// @ts-ignore
			node.altText || node.__altText,
			// @ts-ignore
			node.width ?? node.__width,
			// @ts-ignore
			node.height ?? node.__height,
			key
		);

		// @ts-ignore
		this.___change = node.___change;
	}

	/**
	 * @param {DiffImageNode} node
	 */
	static clone(node) {
		return new DiffImageNode(node, node.__key);
	}

	static getType() {
		return 'diff-image';
	}

	/**
	 * @param {SerializedImageNode} serializedNode
	 */
	static importJSON(serializedNode) {
		const node = $createDiffImageNode(serializedNode).updateFromJSON(serializedNode);
		return node;
	}

	/**
	 * @param {LexicalEditor} editor
	 */
	exportDOM(editor) {
		const dom = super.exportDOM(editor);

		if (
			dom.element instanceof HTMLElement &&
			Object.prototype.hasOwnProperty.call(this.___change, '___type')
		) {
			const span = document.createElement('span');
			span.appendChild(dom.element);

			applyCSSColorDiff(span, this.___change.___type);
			addInformationHover(span, this.___change);

			// We need to wrap ImageNode in a span to make sure 'relative' class works properly.
			dom.element = span;
		}

		return dom;
	}

	exportJSON() {
		return { ...super.exportJSON(), ___change: this.___change, type: DiffImageNode.getType() };
	}

	/**
	 * @param {LexicalEditor} editor
	 * @param {EditorConfig} _config
	 */
	decorate(editor, _config) {
		return super.decorate(editor, _config);
	}
}

/**
 * @param {SerializedImageNode} node
 */
export function $createDiffImageNode(node) {
	return new DiffImageNode(node);
}
