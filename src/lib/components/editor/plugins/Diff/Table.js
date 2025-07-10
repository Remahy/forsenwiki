import { TableNode } from '@lexical/table';
import { addInformationHover, applyCSSColorDiff } from './utils';

/**
 * @typedef {import('lexical').NodeKey} NodeKey
 *
 * @typedef {import('@lexical/table').SerializedTableNode} SerializedTableNode
 */

export class DiffTableNode extends TableNode {
	/** @type {import('./Types').___Change} */
	___change;

	/**
	 * @param {SerializedTableNode | TableNode} node
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
	 * @param {SerializedTableNode} serializedNode
	 */
	static importJSON(serializedNode) {
		const node = $createDiffTableNode(serializedNode).updateFromJSON(serializedNode);
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
		return { ...super.exportJSON(), ___change: this.___change, type: DiffTableNode.getType() };
	}
}

/**
 * @param {SerializedTableNode} node
 */
export function $createDiffTableNode(node) {
	return new DiffTableNode(node);
}
