import { LineBreakNode } from 'lexical';

/**
 * @typedef {import('lexical').NodeKey} NodeKey
 * @typedef {import('lexical').LexicalEditor} LexicalEditor
 * @typedef {import('lexical').EditorConfig} EditorConfig
 *
 * @typedef {import('lexical').SerializedLineBreakNode} SerializedLineBreakNode
 */

export class DiffLineBreakNode extends LineBreakNode {
	/** @type {import('./Types').___Change} */
	___change;

	/**
	 * @param {SerializedLineBreakNode | DiffLineBreakNode} node
	 * @param {NodeKey} [key]
	 */
	constructor(node, key) {
		super(key);

		// @ts-ignore
		this.___change = node.___change;
	}

	/**
	 * @param {DiffLineBreakNode} node
	 */
	static clone(node) {
		return new DiffLineBreakNode(node, node.__key);
	}

	static getType() {
		return 'diff-linebreak';
	}

	/**
	 * @param {SerializedLineBreakNode} serializedNode
	 */
	static importJSON(serializedNode) {
		const node = $createDiffLineBreakNode(serializedNode).updateFromJSON(serializedNode);
		return node;
	}

	/**
	 * @param {LexicalEditor} editor
	 */
	exportDOM(editor) {
		const dom = super.exportDOM(editor);

		// TODO: Support showing linebreak diff.

		return dom;
	}

	exportJSON() {
		return { ...super.exportJSON(), ___change: this.___change, type: DiffLineBreakNode.getType() };
	}
}

/**
 * @param {SerializedLineBreakNode} node
 */
export function $createDiffLineBreakNode(node) {
	return new DiffLineBreakNode(node);
}
