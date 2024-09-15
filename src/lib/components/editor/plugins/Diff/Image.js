import { ImageNode } from '$lib/lexicalCustom';
import { addInformationHover, applyCSSColorDiff } from './utils';

/**
 * @typedef {import("lexical").NodeKey} NodeKey
 * @typedef {import("lexical").LexicalEditor} LexicalEditor
 * @typedef {import("lexical").EditorConfig} EditorConfig
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

		this.setAltText(node.getAltText());
		this.setSrc(node.getSrc());
		this.setWidthAndHeight(node.getWidthAndHeight());

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
	 * @param {LexicalEditor} editor
	 */
	exportDOM(editor) {
		const dom = super.exportDOM(editor);

		if (
			dom.element instanceof HTMLElement &&
			Object.prototype.hasOwnProperty.call(this.___change, '___type')
		) {
			applyCSSColorDiff(dom.element, this.___change.___type);

			const span = document.createElement('span');
			span.classList.add('m-0', 'p-0', 'relative');
			span.appendChild(dom.element);

			addInformationHover(dom.element, this.___change);

			// We need to wrap ImageNode in a span to make sure 'relative' class works properly.
			dom.element = span;
		}

		return dom;
	}

	/**
	 * @param {any} serializedNode
	 */
	static importJSON(serializedNode) {
		const image = ImageNode.importJSON(serializedNode);

		// @ts-ignore
		image.___change = serializedNode.___change;

		const node = new DiffImageNode(image);
		return node;
	}

	exportJSON() {
		return { ...super.exportJSON(), type: this.getType() };
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
