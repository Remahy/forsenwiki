import { $createParagraphNode, ParagraphNode } from 'lexical';
import { addInformationHover, applyCSSColorDiff } from './utils';

/**
 * @typedef {import('lexical').NodeKey} NodeKey
 * @typedef {import('lexical').LexicalEditor} LexicalEditor
 * @typedef {import('lexical').EditorConfig} EditorConfig
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
	 * @param {import('lexical').SerializedParagraphNode} serializedNode
	 */
	static importJSON(serializedNode) {
		const node = $createParagraphNode().updateFromJSON(serializedNode);

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
			applyCSSColorDiff(dom.element, this.___change.___type);

			addInformationHover(dom.element, this.___change);
		}

		return dom;
	}

	exportJSON() {
		return { ...super.exportJSON(), type: DiffParagraphNode.getType() };
	}
}

// /**
//  * @param {ParagraphNode} node
//  */
// export function $createDiffParagraphNode(node) {
// 	return new DiffParagraphNode(node);
// }
