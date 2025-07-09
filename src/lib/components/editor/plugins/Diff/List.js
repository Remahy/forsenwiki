import { $createListNode, ListNode } from '@lexical/list';
import { addInformationHover, applyCSSColorDiff } from './utils';

/**
 * @typedef {import('lexical').NodeKey} NodeKey
 * @typedef {import('lexical').LexicalEditor} LexicalEditor
 * @typedef {import('lexical').EditorConfig} EditorConfig
 */

export class DiffListNode extends ListNode {
	/** @type {import('./Types').___Change} */
	___change;

	/**
	 * @param {ListNode} node
	 * @param {NodeKey} [key]
	 */
	constructor(node, key) {
		super(node.__listType, node.__start, key);

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
	 * @param {import('@lexical/list').SerializedListNode} serializedNode
	 */
	static importJSON(serializedNode) {
		const node = $createListNode().updateFromJSON(serializedNode);
		node.__type = DiffListNode.getType();

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
		return { ...super.exportJSON(), type: DiffListNode.getType() };
	}
}

// /**
//  * @param {ListNode} node
//  */
// export function $createDiffListNode(node) {
// 	return new DiffListNode(node);
// }
