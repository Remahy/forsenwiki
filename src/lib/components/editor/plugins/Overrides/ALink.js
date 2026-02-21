/**
 * Modified from original source
 * https://github.com/facebook/lexical/blob/7150421fabb25fef65f62e18e097d0a8d4a2cde9/packages/lexical-playground/src/nodes/MentionNode.ts
 */

import { $applyNodeReplacement } from 'lexical';

import { LinkNode } from '$lib/lexical/index';

/**
 * @typedef {import('@lexical/link').LinkAttributes} LinkAttributes
 */

export class ALinkNode extends LinkNode {
	__isInternal = false;
	/** @type {string | undefined} */
	__internalId;

	/**
	 * @param {string} [url]
	 * @param {LinkAttributes} [attrs]
	 * @param {boolean} [internal]
	 * @param {string} [internalId]
	 * @param {string} [key]
	 */
	constructor(url, attrs, internal = false, internalId, key) {
		super(url, { ...attrs, target: internal ? attrs?.target : '_blank' }, key);

		this.__isInternal = internal;
		this.__internalId = internalId;
	}

	$config() {
		return this.config('a-link', { extends: LinkNode });
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
			node.__internalId,
			node.__key
		);
	}

	/** @param {import('@lexical/link').SerializedLinkNode & { isInternal: boolean }} serializedNode */
	static importJSON(serializedNode) {
		const node = $createALinkNode().updateFromJSON(serializedNode);

		return node;
	}

	// Getters

	getIsInternal() {
		const self = this.getLatest();
		const value = self.__isInternal;
		return value;
	}

	getInternalId() {
		const self = this.getLatest();
		const value = self.__internalId;
		return value;
	}

	// Setters

	/** @param {boolean} bool */
	setIsInternal(bool) {
		const self = this.getWritable();

		self.__isInternal = bool;

		return this;
	}

	/** @param {string} [internalId] */
	setInternalId(internalId) {
		const self = this.getWritable();

		self.__internalId = internalId;

		return this;
	}

	exportJSON() {
		return {
			...super.exportJSON(),
			__isInternal: this.__isInternal,
			__internalId: this.__internalId,
			type: ALinkNode.getType(),
		};
	}
}

/**
 * @param {string} [url]
 * @param {LinkAttributes} [attrs]
 * @param {boolean} [internal]
 * @param {string} [internalId]
 * @param {string} [key]
 */
export function $createALinkNode(url, attrs, internal, internalId, key) {
	return $applyNodeReplacement(new ALinkNode(url, attrs, internal, internalId, key));
}

/**
 * @param {any} node
 * @returns {node is ALinkNode}
 */
export function $isALinkNode(node) {
	return node instanceof ALinkNode;
}
