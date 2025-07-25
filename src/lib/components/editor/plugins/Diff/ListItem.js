import { ListItemNode } from '@lexical/list';
import { addInformationHover, applyCSSColorDiff } from './utils';

/**
 * @typedef {import('lexical').NodeKey} NodeKey
 * @typedef {import('lexical').LexicalEditor} LexicalEditor
 * @typedef {import('lexical').EditorConfig} EditorConfig
 *
 * @typedef {import('@lexical/list').SerializedListItemNode} SerializedListItemNode
 */

export class DiffListItemNode extends ListItemNode {
	/** @type {import('./Types').___Change} */
	___change;

	/**
	 * @param {SerializedListItemNode | ListItemNode} node
	 * @param {NodeKey} [key]
	 */
	constructor(node, key) {
		// @ts-ignore
		super(node.value ?? node.__value, node.checked ?? node.__checked, key);

		// @ts-ignore
		this.___change = node.___change;
	}

	/**
	 * @param {DiffListItemNode} node
	 */
	static clone(node) {
		return new DiffListItemNode(node, node.__key);
	}

	static getType() {
		return 'diff-listitem';
	}

	/**
	 * @param {SerializedListItemNode} serializedNode
	 */
	static importJSON(serializedNode) {
		const node = $createDiffListItemNode(serializedNode).updateFromJSON(serializedNode);
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

			switch (this.___change.___type) {
				case '~':
					dom.element.classList.add('marker:!text-orange-300');
					break;
				case '+':
					dom.element.classList.add('marker:!text-green-500');
					break;
				case '-':
					dom.element.classList.add('marker:!text-red-500');
					break;
			}

			addInformationHover(dom.element, this.___change);
		}

		return dom;
	}

	static importDOM() {
		return ListItemNode.importDOM ? ListItemNode.importDOM() : null;
	}

	exportJSON() {
		return { ...super.exportJSON(), ___change: this.___change, type: DiffListItemNode.getType() };
	}
}

/**
 * @param {SerializedListItemNode} node
 */
export function $createDiffListItemNode(node) {
	return new DiffListItemNode(node);
}
