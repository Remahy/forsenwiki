import { QuoteNode } from '@lexical/rich-text';
import { applyCSSColorDiff } from './utils';

/**
 * @typedef {import("lexical").NodeKey} NodeKey
 * @typedef {import("lexical").LexicalEditor} LexicalEditor
 * @typedef {import("lexical").EditorConfig} EditorConfig
 */

export class DiffQuoteNode extends QuoteNode {
	/** @type {import('./Types').___Change} */
	___change;

	/**
	 * @param {QuoteNode} node
	 * @param {NodeKey} [key]
	 */
	constructor(node, key) {
		super(key);

		this.setDirection(node.getDirection());
		this.setFormat(node.getFormatType());
		this.setIndent(node.getIndent());
		this.setStyle(node.getStyle());

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
	 * @param {LexicalEditor} editor
	 */
	exportDOM(editor) {
		const dom = super.exportDOM(editor);

		if (dom.element instanceof HTMLElement && this.___change?.type) {
			applyCSSColorDiff(dom.element, this.___change.type);
		}

		return dom;
	}

	/**
	 * @param {any} serializedNode
	 */
	static importJSON(serializedNode) {
		const quote = QuoteNode.importJSON(serializedNode);

		// @ts-ignore
		quote.___change = serializedNode.___change;

		const node = new DiffQuoteNode(quote);
		return node;
	}

	exportJSON() {
		return { ...super.exportJSON(), type: this.getType() };
	}
}

/**
 * @param {QuoteNode} node
 */
export function $createDiffQuoteNode(node) {
	return new DiffQuoteNode(node);
}
