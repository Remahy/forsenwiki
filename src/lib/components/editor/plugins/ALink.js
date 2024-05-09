/**
 * Modified from original source
 * https://github.com/facebook/lexical/blob/7150421fabb25fef65f62e18e097d0a8d4a2cde9/packages/lexical-playground/src/nodes/MentionNode.ts
 */

import { $applyNodeReplacement } from 'lexical'
import { LinkNode, $createLinkNode } from '@lexical/link';

export class ALinkNode extends LinkNode {
	__isInternal = false

	/**
	 * @param {string} url
	 * @param {boolean} internal
	 */
	constructor(url, internal) {
		super(url)

		this.__isInternal = internal;
	}

	/**
	 * @param {ALinkNode} node
	 */
	static clone(node) {
		return new ALinkNode(node.__url, node.__isInternal)
	}

	/** @param {any} serializedNode */
	static importJSON(serializedNode) {
		/** @type {ALinkNode} */
		const node = /** @type {any} */ ($createLinkNode(serializedNode.url, { ...serializedNode }));

		node.setIsInternal(serializedNode.isInternal);

		return node
	}

	/** @param {boolean} bool */
	setIsInternal(bool) {
		this.__isInternal = bool;
	}

	/** @returns {boolean} */
	getIsInternal() {
		return this.__isInternal;
	}

	exportJSON() {
		return {
			...super.exportJSON(),
			__isInternal: this.__isInternal,
			type: this.getType(),
			version: 1
		}
	}
}

/**
 * @param {{url: string, internal: boolean}} arg
 */
export function $createALinkNode({ url, internal }) {
	const aLinkNode = new ALinkNode(url, internal)

	return $applyNodeReplacement(aLinkNode)
}

/**
 * @param {import('lexical').LexicalNode} node
 */
export function $isALinkNode(node) {
	return node instanceof ALinkNode
}
