import { TableRowNode } from '@lexical/table';
import { addInformationHover, applyCSSColorDiff } from './utils';

/**
 * @typedef {import('lexical').NodeKey} NodeKey
 *
 * @typedef {import('@lexical/table').SerializedTableRowNode} SerializedTableRowNode
 */

export class DiffTableRowNode extends TableRowNode {
	/** @type {import('./Types').___Change} */
	___change;

	/**
	 * @param {SerializedTableRowNode | TableRowNode} node
	 * @param {NodeKey} [key]
	 */
	constructor(node, key) {
		// @ts-ignore
		super(node.height ?? node.___height, key);

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
	 * @param {SerializedTableRowNode} serializedNode
	 */
	static importJSON(serializedNode) {
		const node = $createDiffTableRowNode(serializedNode).updateFromJSON(serializedNode);
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
		return { ...super.exportJSON(), ___change: this.___change, type: DiffTableRowNode.getType() };
	}
}

/**
 * @param {SerializedTableRowNode} node
 */
export function $createDiffTableRowNode(node) {
	return new DiffTableRowNode(node);
}
