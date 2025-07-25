import { HeadingNode } from '@lexical/rich-text';
import { addInformationHover, applyCSSColorDiff } from './utils';

/**
 * @typedef {import('lexical').NodeKey} NodeKey
 * @typedef {import('lexical').LexicalEditor} LexicalEditor
 * @typedef {import('lexical').EditorConfig} EditorConfig
 *
 * @typedef {import('@lexical/rich-text').SerializedHeadingNode} SerializedHeadingNode
 */

export class DiffAHeadingNode extends HeadingNode {
	/** @type {import('./Types').___Change} */
	___change;

	/**
	 * @param {SerializedHeadingNode | HeadingNode} node
	 * @param {NodeKey} [key]
	 */
	constructor(node, key) {
		// @ts-ignore
		super(node.tag || node.__tag, key);

		// @ts-ignore
		this.___change = node.___change;
	}

	/**
	 * @param {DiffAHeadingNode} node
	 */
	static clone(node) {
		return new DiffAHeadingNode(node, node.__key);
	}

	static getType() {
		return 'diff-a-heading';
	}

	/**
	 * @param {SerializedHeadingNode} serializedNode
	 */
	static importJSON(serializedNode) {
		const node = $createDiffAHeadingNode(serializedNode).updateFromJSON(serializedNode);
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
		return AHeadingNode.importDOM();
	}

	exportJSON() {
		return { ...super.exportJSON(), ___change: this.___change, type: DiffAHeadingNode.getType() };
	}
}

/**
 * @param {SerializedHeadingNode} node
 */
export function $createDiffAHeadingNode(node) {
	return new DiffAHeadingNode(node);
}
