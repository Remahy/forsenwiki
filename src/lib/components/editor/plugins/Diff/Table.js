import { $createTableNode, TableNode } from '@lexical/table';
import { addInformationHover, applyCSSColorDiff } from './utils';

/**
 * @typedef {import('lexical').NodeKey} NodeKey
 */

export class DiffTableNode extends TableNode {
	/** @type {import('./Types').___Change} */
	___change;

	/**
	 * @param {TableNode} node
	 * @param {NodeKey} [key]
	 */
	constructor(node, key) {
		super(key);

		// @ts-ignore
		this.___change = node.___change;
	}

	/**
	 * @param {DiffTableNode} node
	 */
	static clone(node) {
		return new DiffTableNode(node, node.__key);
	}

	static getType() {
		return 'diff-table';
	}

	/**
	 * @param {import('@lexical/table').SerializedTableNode} serializedNode
	 */
	static importJSON(serializedNode) {
		const node = $createTableNode().updateFromJSON(serializedNode);
		node.__type = DiffTableNode.getType();

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
		return { ...super.exportJSON(), type: DiffTableNode.getType() };
	}
}
