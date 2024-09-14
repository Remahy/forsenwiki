import { ParagraphNode } from 'lexical';

/**
 * @typedef {import("lexical").NodeKey} NodeKey
 * @typedef {import("lexical").LexicalEditor} LexicalEditor
 * @typedef {import("lexical").EditorConfig} EditorConfig
 */

export class DiffParagraphNode extends ParagraphNode {
	/** @type {import('./Types').___Change} */
	___change;

	/**
	 * @param {ParagraphNode} node
	 * @param {NodeKey} [key]
	 */
	constructor(node, key) {
		super(key);

		this.setDirection(node.getDirection());
		this.setFormat(node.getFormatType());
		this.setIndent(node.getIndent());
		this.setStyle(node.getStyle());
		this.setTextFormat(node.getTextFormat());
		this.setTextStyle(node.getTextStyle());

		// @ts-ignore
		this.___change = node.___change;
	}

	/**
	 * @param {DiffParagraphNode} node
	 */
	static clone(node) {
		// @ts-ignore
		return new DiffParagraphNode(node, node.__key);
	}

	static getType() {
		return 'diff-paragraph';
	}

	/**
	 * @param {LexicalEditor} editor
	 */
	exportDOM(editor) {
		const dom = super.exportDOM(editor);

		if (dom.element instanceof HTMLElement && this.___change?.type) {
			switch (this.___change?.type) {
				case '~':
					// Modified.
					dom.element.style.outline = '1px orange dotted';
					break;
				case '+':
					// Added.
					dom.element.style.outline = '1px green solid';
					break;
				case '-':
					dom.element.style.outline = '1px red solid';
					break;
			}
		}

		return dom;
	}

	/**
	 * @param {any} serializedNode
	 */
	static importJSON(serializedNode) {
		const paragraph = ParagraphNode.importJSON(serializedNode);

		// @ts-ignore
		paragraph.___change = serializedNode.___change;

		const node = new DiffParagraphNode(paragraph);
		return node;
	}

	exportJSON() {
		return { ...super.exportJSON(), type: this.getType() };
	}
}

/**
 * @param {ParagraphNode} node
 */
export function $createDiffParagraphNode(node) {
	return new DiffParagraphNode(node);
}
