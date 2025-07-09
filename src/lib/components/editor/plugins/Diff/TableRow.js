import { $createTableRowNode, TableRowNode } from '@lexical/table';
import { addInformationHover, applyCSSColorDiff } from './utils';

/**
 * @typedef {import('lexical').NodeKey} NodeKey
 */

export class DiffTableRowNode extends TableRowNode {
	/** @type {import('./Types').___Change} */
	___change;

	/**
	 * @param {TableRowNode} node
	 * @param {NodeKey} [key]
	 */
	constructor(node, key) {
		super(node.getHeight(), key);

		// @ts-ignore
		this.___change = node.___change;
	}

	/**
	 * @param {DiffTableRowNode} node
	 */
	static clone(node) {
		return new DiffTableRowNode(node, node.__key);
	}

	static getType() {
		return 'diff-tablerow';
	}

	/**
	 * @param {import('@lexical/table').SerializedTableRowNode} serializedNode
	 */
	static importJSON(serializedNode) {
		const node = $createTableRowNode().updateFromJSON(serializedNode);
		node.__type = DiffTableRowNode.getType();

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
		return { ...super.exportJSON(), type: DiffTableRowNode.getType() };
	}
}
