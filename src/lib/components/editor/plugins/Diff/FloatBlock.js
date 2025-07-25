import { FloatBlockNode } from '../FloatBlock/FloatBlock';
import { addInformationHover, applyCSSColorDiff } from './utils';

/**
 * @typedef {import('lexical').NodeKey} NodeKey
 *
 * @typedef {import('../FloatBlock/FloatBlock').SerializedFloatBlockNode} SerializedFloatBlockNode
 */

export class DiffFloatBlockNode extends FloatBlockNode {
	/** @type {import('./Types').___Change} */
	___change;

	/**
	 * @param {SerializedFloatBlockNode | DiffFloatBlockNode} node
	 * @param {NodeKey} [key]
	 */
	constructor(node, key) {
		// @ts-ignore
		super(node.float || node.__float, node.width || node.__width, node.height || node.__height, key);

		// @ts-ignore
		this.___change = node.___change;
	}

	static getType() {
		return 'diff-float-block';
	}

	/**
	 * @param {DiffFloatBlockNode} node
	 */
	static clone(node) {
		return new DiffFloatBlockNode(node, node.__key);
	}

	/**
	 * @param {SerializedFloatBlockNode} serializedNode
	 */
	static importJSON(serializedNode) {
		const node = $createDiffFloatBlockNode(serializedNode).updateFromJSON(serializedNode);
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
			applyCSSColorDiff(dom.element, this.___change.___type);

			addInformationHover(dom.element, this.___change);
		}

		return dom;
	}

	static importDOM() {
		return FloatBlockNode.importDOM ? FloatBlockNode.importDOM() : null;
	}
}

/**
 * @param {SerializedFloatBlockNode} node
 */
export function $createDiffFloatBlockNode(node) {
	return new DiffFloatBlockNode(node);
}
