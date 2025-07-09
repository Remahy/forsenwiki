import { addInformationHover, applyCSSColorDiff } from './utils';
import { $createATableCellNode, ATableCellNode } from '../Table/ATableCellNode';

/**
 * @typedef {import('lexical').NodeKey} NodeKey
 */

export class DiffATableCellNode extends ATableCellNode {
	/** @type {import('./Types').___Change} */
	___change;

	/**
	 * @param {ATableCellNode} node
	 * @param {NodeKey} [key]
	 */
	constructor(node, key) {
		super(node.getHeaderStyles(), node.getColSpan(), node.getWidth(), key);

		// @ts-ignore
		this.___change = node.___change;
	}

	/**
	 * @param {DiffATableCellNode} node
	 */
	static clone(node) {
		return new DiffATableCellNode(node, node.__key);
	}

	static getType() {
		return 'diff-a-tablecell';
	}

	/**
	 * @param {import('@lexical/table').SerializedTableCellNode} serializedNode
	 */
	static importJSON(serializedNode) {
		const node = $createATableCellNode().updateFromJSON(serializedNode);
		node.__type = DiffATableCellNode.getType();

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
		return { ...super.exportJSON(), type: DiffATableCellNode.getType() };
	}
}
