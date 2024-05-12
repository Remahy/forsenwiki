/**
 * Modified from original source
 * https://github.com/facebook/lexical/blob/7150421fabb25fef65f62e18e097d0a8d4a2cde9/packages/lexical-playground/src/nodes/MentionNode.ts
 */

import { $applyNodeReplacement } from 'lexical'

import { LinkNode } from '$lib/lexical.mjs'

/**
 * @typedef {import("@lexical/link").LinkAttributes | undefined} LinkAttributes
 */

export class ALinkNode extends LinkNode {
	__isInternal = false;

	/**
	 * @param {string} url
	 * @param {LinkAttributes} attrs
	 * @param {boolean} internal
	 * @param {string | undefined} key
	 */
	constructor(url, attrs, internal = false, key) {
		super(url, attrs, key)

		this.setIsInternal(internal);
	}

	static getType() {
		return 'a-link'
	}

	/**
	 * @param {ALinkNode} node
	 */
	static clone(node) {
		return new ALinkNode(
			node.__url,
			{ rel: node.__rel, target: node.__target, title: node.__title },
			node.__isInternal,
			node.__key
		)
	}

	/** @param {any} serializedNode */
	static importJSON(serializedNode) {
		/** @type {ALinkNode} */
		const node = /** @type {any} */ (new LinkNode(serializedNode.url, { ...serializedNode }));

		node.setIsInternal(serializedNode.isInternal);
		node.__type = ALinkNode.getType();

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
		}
	}
}

/**
 * @param {string} url
 * @param {LinkAttributes} attrs
 * @param {boolean} internal
 * @param {string | undefined} key
 */
export function $createALinkNode(url, attrs, internal, key = undefined) {
	return $applyNodeReplacement(new ALinkNode(url, attrs, internal, key))
}

/**
 * @param {any} node
 * @returns {node is ALinkNode}
 */
export function $isALinkNode(node) {
	return node instanceof ALinkNode
}
