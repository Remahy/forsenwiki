import { TableCellNode } from '$lib/lexical/index';
import { addInformationHover, applyCSSColorDiff } from './utils';

/**
 * @typedef {import('lexical').NodeKey} NodeKey
 *
 * @typedef {import('@lexical/table').SerializedTableCellNode} SerializedTableCellNode
 */

export class DiffTableCellNode extends TableCellNode {
	/** @type {import('./Types').___Change} */
	___change;

	/**
	 * @param {SerializedTableCellNode | TableCellNode} node
	 * @param {NodeKey} [key]
	 */
	constructor(node, key) {
		super(
			// @ts-ignore
			node.headerState ?? node.__headerState,
			// @ts-ignore
			node.colSpan ?? node.__colSpan,
			// @ts-ignore
			node.width ?? node.__width,
			key
		);

		// @ts-ignore
		this.___change = node.___change;
	}

	/**
	 * @param {DiffTableCellNode} node
	 */
	static clone(node) {
		return new DiffTableCellNode(node, node.__key);
	}

	static getType() {
		return 'diff-tablecell';
	}

	/**
	 * @param {SerializedTableCellNode} serializedNode
	 */
	static importJSON(serializedNode) {
		const node = $createDiffTableCellNode(serializedNode).updateFromJSON(serializedNode);
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
		return TableCellNode.importDOM();
	}

	exportJSON() {
		return { ...super.exportJSON(), ___change: this.___change, type: DiffTableCellNode.getType() };
	}
}

/**
 * @param {SerializedTableCellNode} node
 */
export function $createDiffTableCellNode(node) {
	return new DiffTableCellNode(node);
}
