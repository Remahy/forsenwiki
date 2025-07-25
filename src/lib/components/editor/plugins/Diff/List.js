import { ListNode } from '@lexical/list';
import { addInformationHover, applyCSSColorDiff } from './utils';

/**
 * @typedef {import('lexical').NodeKey} NodeKey
 * @typedef {import('lexical').LexicalEditor} LexicalEditor
 * @typedef {import('lexical').EditorConfig} EditorConfig
 *
 * @typedef {import('@lexical/list').SerializedListNode} SerializedListNode
 */

export class DiffListNode extends ListNode {
	/** @type {import('./Types').___Change} */
	___change;

	/**
	 * @param {SerializedListNode | ListNode} node
	 * @param {NodeKey} [key]
	 */
	constructor(node, key) {
		// @ts-ignore
		super(node.listType || node.__listType, node.start ?? node.__start, key);

		// @ts-ignore
		this.___change = node.___change;
	}

	/**
	 * @param {DiffListNode} node
	 */
	static clone(node) {
		return new DiffListNode(node, node.__key);
	}

	static getType() {
		return 'diff-list';
	}

	/**
	 * @param {SerializedListNode} serializedNode
	 */
	static importJSON(serializedNode) {
		const node = $createDiffListNode(serializedNode).updateFromJSON(serializedNode);
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
		return ListNode.importDOM ? ListNode.importDOM() : null;
	}

	exportJSON() {
		return { ...super.exportJSON(), ___change: this.___change, type: DiffListNode.getType() };
	}
}

/**
 * @param {SerializedListNode} node
 */
export function $createDiffListNode(node) {
	return new DiffListNode(node);
}
