import { addInformationHover, applyCSSColorDiff } from './utils';
import { GalleryNode } from '$lib/lexical/custom';

/**
 * @typedef {import('lexical').NodeKey} NodeKey
 *
 * @typedef {import('../Gallery/Gallery').SerializedGalleryNode} SerializedGalleryNode
 */

export class DiffGalleryNode extends GalleryNode {
	/** @type {import('./Types').___Change} */
	___change;

	/**
	 * @param {SerializedGalleryNode | GalleryNode} node
	 * @param {NodeKey} [key]
	 */
	constructor(node, key) {
		super(key);

		// @ts-ignore
		this.___change = node.___change;
	}

	/**
	 * @param {DiffGalleryNode} node
	 */
	static clone(node) {
		return new DiffGalleryNode(node, node.__key);
	}

	static getType() {
		return 'diff-gallery';
	}

	/**
	 * @param {SerializedGalleryNode} serializedNode
	 */
	static importJSON(serializedNode) {
		const node = $createDiffGalleryNode(serializedNode).updateFromJSON(serializedNode);
		return node;
	}

	static importDOM() {
		return GalleryNode.importDOM ? GalleryNode.importDOM() : null;
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
		return { ...super.exportJSON(), ___change: this.___change, type: DiffGalleryNode.getType() };
	}
}

/**
 * @param {SerializedGalleryNode} node
 */
export function $createDiffGalleryNode(node) {
	return new DiffGalleryNode(node);
}
