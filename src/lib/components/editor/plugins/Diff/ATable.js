import { addInformationHover, applyCSSColorDiff } from './utils';
import { ATableNode } from '$lib/lexical/custom';

/**
 * @typedef {import('lexical').NodeKey} NodeKey
 *
 * @typedef {import('@lexical/table').SerializedTableNode} SerializedTableNode
 */

export class DiffATableNode extends ATableNode {
	/** @type {import('./Types').___Change} */
	___change;

	/**
	 * @param {SerializedTableNode | ATableNode} node
	 * @param {NodeKey} [key]
	 */
	constructor(node, key) {
		super(key);

		// @ts-ignore
		this.___change = node.___change;
	}

	/**
	 * @param {DiffATableNode} node
	 */
	static clone(node) {
		return new DiffATableNode(node, node.__key);
	}

	static getType() {
		return 'diff-a-table';
	}

	/**
	 * @param {SerializedTableNode} serializedNode
	 */
	static importJSON(serializedNode) {
		const node = $createDiffATableNode(serializedNode).updateFromJSON(serializedNode);
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
		return ATableNode.importDOM();
	}

	exportJSON() {
		return { ...super.exportJSON(), ___change: this.___change, type: DiffATableNode.getType() };
	}
}

/**
 * @param {SerializedTableNode} node
 */
export function $createDiffATableNode(node) {
	return new DiffATableNode(node);
}
