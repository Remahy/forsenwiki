import { TableNode } from '@lexical/table';
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

		this.setDirection(node.getDirection());
		this.setFormat(node.getFormatType());
		this.setIndent(node.getIndent());
		this.setStyle(node.getStyle());

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
		const table = TableNode.importJSON(serializedNode);

		// @ts-ignore
		table.___change = serializedNode.___change;

		const node = new DiffTableNode(table);

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
