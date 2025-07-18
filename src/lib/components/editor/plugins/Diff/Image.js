import { ImageNode } from '$lib/lexical/custom';
import { $createImageNode } from '../Image/Image';
import { addInformationHover, applyCSSColorDiff } from './utils';

/**
 * @typedef {import('lexical').NodeKey} NodeKey
 * @typedef {import('lexical').LexicalEditor} LexicalEditor
 * @typedef {import('lexical').EditorConfig} EditorConfig
 */

export class DiffImageNode extends ImageNode {
	/** @type {import('./Types').___Change} */
	___change;

	/**
	 * @param {ImageNode} node
	 * @param {NodeKey} [key]
	 */
	constructor(node, key) {
		super(node.__src, node.__altText, node.__width, node.__height, key);

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
	 * @param {import('../Image/Image').SerializedImageNode} serializedNode
	 */
	static importJSON(serializedNode) {
		const node = $createImageNode().updateFromJSON(serializedNode);

		// @ts-ignore
		node.___change = serializedNode.___change;

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
		return { ...super.exportJSON(), type: DiffImageNode.getType() };
	}

	/**
	 * @param {LexicalEditor} editor
	 * @param {EditorConfig} _config
	 */
	decorate(editor, _config) {
		return super.decorate(editor, _config);
	}
}

// /**
//  * @param {ImageNode} node
//  */
// export function $createDiffImageNode(node) {
// 	return new DiffImageNode(node);
// }
