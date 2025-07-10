import { ALinkNode } from '$lib/lexical/custom';
import { addInformationHover, applyCSSColorDiff } from './utils';

/**
 * @typedef {import('lexical').NodeKey} NodeKey
 * @typedef {import('lexical').LexicalEditor} LexicalEditor
 * @typedef {import('lexical').EditorConfig} EditorConfig
 *
 * @typedef {import('@lexical/link').SerializedLinkNode} SerializedLinkNode
 */

export class DiffALinkNode extends ALinkNode {
	/** @type {import('./Types').___Change} */
	___change;

	/**
	 * @param {SerializedLinkNode | ALinkNode} node
	 * @param {NodeKey} [key]
	 */
	constructor(node, key) {
		super(
			// @ts-ignore
			node.url || node.__url,
			// @ts-ignore
			{ rel: node.rel || node.__rel, target: node.target || node.__target, title: node.title || node.__title },
			// @ts-ignore
			node.isInternal ?? node.__isInternal,
			key
		);

		// @ts-ignore
		this.___change = node.___change;
	}

	/**
	 * @param {DiffALinkNode} node
	 */
	static clone(node) {
		return new DiffALinkNode(node, node.__key);
	}

	static getType() {
		return 'diff-a-link';
	}

	/**
	 * @param {SerializedLinkNode} serializedNode
	 */
	static importJSON(serializedNode) {
		const node = $createDiffALinkNode(serializedNode).updateFromJSON(serializedNode);
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
		return { ...super.exportJSON(), ___change: this.___change, type: DiffALinkNode.getType() };
	}
}

/**
 * @param {SerializedLinkNode} node
 */
export function $createDiffALinkNode(node) {
	return new DiffALinkNode(node);
}
