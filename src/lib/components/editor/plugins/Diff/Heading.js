import { HeadingNode } from '$lib/lexical/index';
import { addInformationHover, applyCSSColorDiff } from './utils';

/**
 * @typedef {import('lexical').NodeKey} NodeKey
 * @typedef {import('lexical').LexicalEditor} LexicalEditor
 * @typedef {import('lexical').EditorConfig} EditorConfig
 *
 * @typedef {import('@lexical/rich-text').SerializedHeadingNode} SerializedHeadingNode
 */

export class DiffHeadingNode extends HeadingNode {
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
	 * @param {DiffHeadingNode} node
	 */
	static clone(node) {
		return new DiffHeadingNode(node, node.__key);
	}

	static getType() {
		return 'diff-heading';
	}

	/**
	 * @param {SerializedHeadingNode} serializedNode
	 */
	static importJSON(serializedNode) {
		const node = $createDiffHeadingNode(serializedNode).updateFromJSON(serializedNode);
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
		return HeadingNode.importDOM();
	}

	exportJSON() {
		return { ...super.exportJSON(), ___change: this.___change, type: DiffHeadingNode.getType() };
	}
}

/**
 * @param {SerializedHeadingNode} node
 */
export function $createDiffHeadingNode(node) {
	return new DiffHeadingNode(node);
}
