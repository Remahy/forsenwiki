import { $createLineBreakNode, LineBreakNode } from 'lexical';

/**
 * @typedef {import('lexical').NodeKey} NodeKey
 * @typedef {import('lexical').LexicalEditor} LexicalEditor
 * @typedef {import('lexical').EditorConfig} EditorConfig
 */

export class DiffLineBreakNode extends LineBreakNode {
	/**
	 * @param {NodeKey} [key]
	 */
	constructor(key) {
		super(key);
	}

	/**
	 * @param {DiffLineBreakNode} node
	 */
	static clone(node) {
		return new DiffLineBreakNode(node.__key);
	}

	static getType() {
		return 'diff-linebreak';
	}

	/**
	 * @param {import('lexical').SerializedLineBreakNode} serializedNode
	 */
	static importJSON(serializedNode) {
		const node = $createLineBreakNode().updateFromJSON(serializedNode);

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
		return { ...super.exportJSON(), type: DiffLineBreakNode.getType() };
	}
}
