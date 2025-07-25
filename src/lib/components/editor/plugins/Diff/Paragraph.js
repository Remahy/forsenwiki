import { ParagraphNode } from 'lexical';
import { addInformationHover, applyCSSColorDiff } from './utils';

/**
 * @typedef {import('lexical').NodeKey} NodeKey
 * @typedef {import('lexical').LexicalEditor} LexicalEditor
 * @typedef {import('lexical').EditorConfig} EditorConfig
 *
 * @typedef {import('lexical').SerializedParagraphNode} SerializedParagraphNode
 */

export class DiffParagraphNode extends ParagraphNode {
	/** @type {import('./Types').___Change} */
	___change;

	/**
	 * @param {SerializedParagraphNode | DiffParagraphNode} node
	 * @param {NodeKey} [key]
	 */
	constructor(node, key) {
		super(key);

		// @ts-ignore
		this.___change = node.___change;
	}

	/**
	 * @param {DiffParagraphNode} node
	 */
	static clone(node) {
		return new DiffParagraphNode(node, node.__key);
	}

	static getType() {
		return 'diff-paragraph';
	}

	/**
	 * @param {SerializedParagraphNode} serializedNode
	 */
	static importJSON(serializedNode) {
		const node = $createDiffParagraphNode(serializedNode).updateFromJSON(serializedNode);
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
		return ParagraphNode.importDOM();
	}

	exportJSON() {
		return { ...super.exportJSON(), ___change: this.___change, type: DiffParagraphNode.getType() };
	}
}

/**
 * @param {SerializedParagraphNode} node
 */
export function $createDiffParagraphNode(node) {
	return new DiffParagraphNode(node);
}
