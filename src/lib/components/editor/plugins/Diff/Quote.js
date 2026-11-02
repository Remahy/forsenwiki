import { QuoteNode } from '@lexical/rich-text';
import { addInformationHover, applyCSSColorDiff } from './utils';

/**
 * @typedef {import('lexical').NodeKey} NodeKey
 * @typedef {import('lexical').LexicalEditor} LexicalEditor
 * @typedef {import('lexical').EditorConfig} EditorConfig
 *
 * @typedef {import('@lexical/rich-text').SerializedQuoteNode} SerializedQuoteNode
 */

export class DiffQuoteNode extends QuoteNode {
	/** @type {import('./Types').___Change} */
	___change;

	/**
	 * @param {SerializedQuoteNode | QuoteNode} node
	 * @param {NodeKey} [key]
	 */
	constructor(node, key) {
		super(key);

		// @ts-ignore
		this.___change = node.___change;
	}

	/**
	 * @param {DiffQuoteNode} node
	 */
	static clone(node) {
		return new DiffQuoteNode(node, node.__key);
	}

	static getType() {
		return 'diff-quote';
	}

	/**
	 * @param {SerializedQuoteNode} serializedNode
	 */
	static importJSON(serializedNode) {
		const node = $createDiffQuoteNode(serializedNode).updateFromJSON(serializedNode);
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

	exportJSON() {
		return { ...super.exportJSON(), ___change: this.___change, type: DiffQuoteNode.getType() };
	}
}

/**
 * @param {SerializedQuoteNode} node
 */
export function $createDiffQuoteNode(node) {
	return new DiffQuoteNode(node);
}
