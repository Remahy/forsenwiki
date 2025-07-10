import { ATableCellNode } from '../Table/ATableCellNode';
import { addInformationHover, applyCSSColorDiff } from './utils';

/**
 * @typedef {import('lexical').NodeKey} NodeKey
 *
 * @typedef {import('@lexical/table').SerializedTableCellNode} SerializedTableCellNode
 */

export class DiffATableCellNode extends ATableCellNode {
	/** @type {import('./Types').___Change} */
	___change;

	/**
	 * @param {SerializedTableCellNode | ATableCellNode} node
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
	 * @param {DiffATableCellNode} node
	 */
	static clone(node) {
		return new DiffATableCellNode(node, node.__key);
	}

	static getType() {
		return 'diff-a-tablecell';
	}

	/**
	 * @param {SerializedTableCellNode} serializedNode
	 */
	static importJSON(serializedNode) {
		const node = $createDiffATableCellNode(serializedNode).updateFromJSON(serializedNode);
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
		return { ...super.exportJSON(), ___change: this.___change, type: DiffATableCellNode.getType() };
	}
}

/**
 * @param {SerializedTableCellNode} node
 */
export function $createDiffATableCellNode(node) {
	return new DiffATableCellNode(node);
}
