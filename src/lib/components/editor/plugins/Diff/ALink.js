import { ALinkNode } from '$lib/lexical/custom';
import { $createALinkNode } from '../ALink/ALinkNode';
import { addInformationHover, applyCSSColorDiff } from './utils';

/**
 * @typedef {import('lexical').NodeKey} NodeKey
 * @typedef {import('lexical').LexicalEditor} LexicalEditor
 * @typedef {import('lexical').EditorConfig} EditorConfig
 */

export class DiffALinkNode extends ALinkNode {
	/** @type {import('./Types').___Change} */
	___change;

	/**
	 * @param {ALinkNode} node
	 * @param {NodeKey} [key]
	 */
	constructor(node, key) {
		super(
			node.__url,
			{ rel: node.__rel, target: node.__target, title: node.__title },
			node.__isInternal,
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
	 * @param {import('@lexical/link').SerializedLinkNode & { isInternal: boolean }} serializedNode
	 */
	static importJSON(serializedNode) {
		const node = $createALinkNode().updateFromJSON(serializedNode);

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
		return { ...super.exportJSON(), type: DiffALinkNode.getType() };
	}
}

// /**
//  * @param {ALinkNode} node
//  */
// export function $createDiffALinkNode(node) {
// 	return new DiffALinkNode(node);
// }
