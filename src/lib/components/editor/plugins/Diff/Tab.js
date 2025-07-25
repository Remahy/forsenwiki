import { TabNode } from 'lexical';

/**
 * @typedef {import('lexical').NodeKey} NodeKey
 * @typedef {import('lexical').LexicalEditor} LexicalEditor
 * @typedef {import('lexical').EditorConfig} EditorConfig
 *
 * @typedef {import('lexical').SerializedTabNode} SerializedTabNode
 */

export class DiffTabNode extends TabNode {
	/** @type {import('./Types').___Change} */
	___change;

	/**
	 * @param {SerializedTabNode | DiffTabNode} node
	 * @param {NodeKey} [key]
	 */
	constructor(node, key) {
		super(key);

		// @ts-ignore
		this.___change = node.___change;
	}

	/**
	 * @param {DiffTabNode} node
	 */
	static clone(node) {
		return new DiffTabNode(node, node.__key);
	}

	static getType() {
		return 'diff-tab';
	}

	/**
	 * @param {SerializedTabNode} serializedNode
	 */
	static importJSON(serializedNode) {
		const node = $createDiffTabNode(serializedNode).updateFromJSON(serializedNode);
		node.__type = DiffTabNode.getType();

		// @ts-ignore
		node.___change = serializedNode.___change;

		return node;
	}

	/**
	 * @param {LexicalEditor} editor
	 */
	exportDOM(editor) {
		const dom = super.exportDOM(editor);

		// TODO: Support showing tab diff.

		return dom;
	}

	static importDOM() {
		return TabNode.importDOM();
	}

	exportJSON() {
		return { ...super.exportJSON(), ___change: this.___change, type: DiffTabNode.getType() };
	}
}

/**
 * @param {SerializedTabNode} node
 */
export function $createDiffTabNode(node) {
	return new DiffTabNode(node);
}
