/**
 * Modified from original source
 * https://github.com/facebook/lexical/blob/7150421fabb25fef65f62e18e097d0a8d4a2cde9/packages/lexical-playground/src/nodes/MentionNode.ts
 */

import { $applyNodeReplacement } from 'lexical';

import { LinkNode } from '$lib/lexical/index';

/**
 * @typedef {import("@lexical/link").LinkAttributes | undefined} LinkAttributes
 */

export class ALinkNode extends LinkNode {
	__isInternal = false;

	/**
	 * @param {string} url
	 * @param {LinkAttributes} attrs
	 * @param {boolean} internal
	 * @param {string} [key]
	 */
	constructor(url, attrs, internal = false, key) {
		super(url, { ...attrs, target: internal ? attrs?.target : '_blank' }, key);

		this.setIsInternal(internal);
	}

	static getType() {
		return 'a-link';
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
		);
	}

	/** @param {import('@lexical/link').SerializedLinkNode & { isInternal: boolean }} serializedNode */
	static importJSON(serializedNode) {
		/** @type {ALinkNode} */
		const node = /** @type {any} */ (new ALinkNode(serializedNode.url, { ...serializedNode }));

		node.setIsInternal(serializedNode.isInternal);
		node.setDirection(serializedNode.direction);
		node.setFormat(serializedNode.format);
		node.setIndent(serializedNode.indent);
		if (serializedNode.rel) {
			node.setRel(serializedNode.rel);
		}

		node.__type = ALinkNode.getType();

		return node;
	}

	// Getters

	/** @returns {boolean} */
	getIsInternal() {
		return this.__isInternal;
	}

	// Setters

	/** @param {boolean} bool */
	setIsInternal(bool) {
		this.__isInternal = bool;
	}

	exportJSON() {
		return {
			...super.exportJSON(),
			__isInternal: this.__isInternal,
			type: ALinkNode.getType(),
		};
	}
}

/**
 * @param {string} url
 * @param {LinkAttributes} attrs
 * @param {boolean} internal
 * @param {string} [key]
 */
export function $createALinkNode(url, attrs, internal, key) {
	return $applyNodeReplacement(new ALinkNode(url, attrs, internal, key));
}

/**
 * @param {any} node
 * @returns {node is ALinkNode}
 */
export function $isALinkNode(node) {
	return node instanceof ALinkNode;
}
