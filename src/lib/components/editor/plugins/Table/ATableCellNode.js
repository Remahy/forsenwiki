import { $applyNodeReplacement, isHTMLElement } from 'lexical';
import { TableCellNode } from '$lib/lexical/index';

/**
 * @typedef {import('lexical').NodeKey} NodeKey
 * @typedef {import('@lexical/table').TableCellHeaderStates} TableCellHeaderStates
 */

export class ATableCellNode extends TableCellNode {
	/**
	 * @param {TableCellHeaderStates} headerState
	 * @param {number} colSpan
	 * @param {number} [width]
	 * @param {NodeKey} [key]
	 */
	constructor(headerState, colSpan, width, key) {
		super(headerState, colSpan, width, key);
	}

	static getType() {
		return 'a-tablecell';
	}

	/**
	 * @param {ATableCellNode} node
	 */
	static clone(node) {
		return new ATableCellNode(node.__headerState, node.__colSpan, node.__width, node.__key);
	}

	/** @param {any} serializedNode */
	static importJSON(serializedNode) {
		/** @type {ATableCellNode} */
		const node = /** @type {any} */ (
			new ATableCellNode(serializedNode.headerState, serializedNode.colSpan, serializedNode.width)
		);

		node.__type = ATableCellNode.getType();

		return node;
	}
	/**
	 * @param {LexicalEditor} editor
	 */
	exportDOM(editor) {
		const output = super.exportDOM(editor);

		if (isHTMLElement(output.element)) {
			const element = /** @type {HTMLTableCellElement} */ (output.element);

			element.style.removeProperty('border');
		}

		return output;
	}

	exportJSON() {
		return {
			...super.exportJSON(),
			type: this.getType(),
		};
	}
}

/**
 * @param {TableCellHeaderStates} headerState
 * @param {number} colSpan
 * @param {number} [width]
 * @param {string} [key]
 */
export function $createATableCellNode(headerState, colSpan, width, key) {
	return $applyNodeReplacement(new ATableCellNode(headerState, colSpan, width, key));
}