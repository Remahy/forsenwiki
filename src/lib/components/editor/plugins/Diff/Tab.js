import { TabNode } from 'lexical';

/**
 * @typedef {import("lexical").NodeKey} NodeKey
 * @typedef {import("lexical").LexicalEditor} LexicalEditor
 * @typedef {import("lexical").EditorConfig} EditorConfig
 */

export class DiffTabNode extends TabNode {
	/**
	 * @param {NodeKey} [key]
	 */
	constructor(key) {
		super(key);
	}

	/**
	 * @param {DiffTabNode} node
	 */
	static clone(node) {
		return new DiffTabNode(node.__key);
	}

	static getType() {
		return 'diff-tab';
	}

	/**
	 * @param {any} serializedNode
	 */
	static importJSON(serializedNode) {
		const tab = TabNode.importJSON(serializedNode);

		tab.setFormat(serializedNode.format);
		tab.setStyle(serializedNode.style);

		return tab;
	}

	/**
	 * @param {LexicalEditor} editor
	 */
	exportDOM(editor) {
		const dom = super.exportDOM(editor);

		// TODO: Support showing tab diff.

		return dom;
	}

	exportJSON() {
		return { ...super.exportJSON(), type: this.getType() };
	}
}