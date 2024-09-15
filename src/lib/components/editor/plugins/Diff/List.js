import { ListNode } from '@lexical/list';
import { addInformationHover, applyCSSColorDiff } from './utils';

/**
 * @typedef {import("lexical").NodeKey} NodeKey
 * @typedef {import("lexical").LexicalEditor} LexicalEditor
 * @typedef {import("lexical").EditorConfig} EditorConfig
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

		this.setDirection(node.getDirection());
		this.setFormat(node.getFormatType());
		this.setIndent(node.getIndent());
		this.setListType(node.getListType());
		this.setStyle(node.getStyle());

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

	/**
	 * @param {any} serializedNode
	 */
	static importJSON(serializedNode) {
		const list = ListNode.importJSON(serializedNode);

		// @ts-ignore
		list.___change = serializedNode.___change;

		const node = new DiffListNode(list);
		return node;
	}

	exportJSON() {
		return { ...super.exportJSON(), type: this.getType() };
	}
}

/**
 * @param {ListNode} node
 */
export function $createDiffHeadingNode(node) {
	return new DiffListNode(node);
}
