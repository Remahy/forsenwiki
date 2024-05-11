/**
 * Modified from original source
 * https://github.com/facebook/lexical/blob/7150421fabb25fef65f62e18e097d0a8d4a2cde9/packages/lexical-playground/src/nodes/MentionNode.ts
 */

import { $applyNodeReplacement } from 'lexical'
import { $createLinkNode } from '@lexical/link';

import { LinkNode } from '$lib/lexical.mjs'

export class ALinkNode extends LinkNode {
	__isInternal = false;

	static getType () {
		return 'a-link'
	}

	/**
	 * @param {string} url
	 * @param {boolean} internal
	 * @param {string | undefined} key
	 */
	constructor(url, internal, key) {
		super(url, undefined, key)

		this.__isInternal = internal;
	}

	/**
	 * @param {ALinkNode} node
	 */
	static clone(node) {
		return new ALinkNode(node.__url, node.__isInternal, node.__key)
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
 * @param {string} url
 * @param {boolean} internal
 * @param {string | undefined} key
 */
export function $createALinkNode(url, internal, key) {
	const aLinkNode = new ALinkNode(url, internal, key)

	return $applyNodeReplacement(aLinkNode)
}

/**
 * @param {LexicalNode} node
 */
export function $isALinkNode(node) {
	return node instanceof ALinkNode
}
