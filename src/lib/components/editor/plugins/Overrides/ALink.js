/**
 * Modified from original source
 * https://github.com/facebook/lexical/blob/7150421fabb25fef65f62e18e097d0a8d4a2cde9/packages/lexical-playground/src/nodes/MentionNode.ts
 */

import {
	$applyNodeReplacement,
	booleanValue,
	nodeSchema,
	optional,
	stringValue,
	withField,
} from 'lexical';

import { LinkNode } from '$lib/lexical/index';

/**
 * @typedef {import('@lexical/link').LinkAttributes} LinkAttributes
 * @typedef {import('lexical').EditorConfig} EditorConfig
 */

// Declared so collaboration stores the link as a format with these fields, like LinkNode's own.
const aLinkNodeSchema = /** @type {typeof nodeSchema<ALinkNode>} */ (nodeSchema)()({
	isInternal: withField(booleanValue(), { field: '__isInternal' }),
	internalId: withField(optional(stringValue()), { field: '__internalId' }),
});

export class ALinkNode extends LinkNode {
	__isInternal = false;
	/** @type {string | undefined} */
	__internalId = undefined;

	/**
	 * Every argument has a default, so $config can create getType, clone and importJSON.
	 * @param {string} [url]
	 * @param {LinkAttributes} [attrs]
	 * @param {boolean} [internal]
	 * @param {string} [internalId]
	 * @param {string} [key]
	 */
	constructor(url = '', attrs = {}, internal = false, internalId = undefined, key = undefined) {
		super(url, { ...attrs, target: internal ? attrs?.target : '_blank' }, key);

		this.__isInternal = internal;
		this.__internalId = internalId;
	}

	$config() {
		return this.config('a-link', { extends: LinkNode, json: aLinkNodeSchema });
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

		self.setTarget(bool ? null : '_blank');

		return this;
	}

	/** @param {string} [internalId] */
	setInternalId(internalId) {
		const self = this.getWritable();

		self.__internalId = internalId;

		return this;
	}

	/**
	 * @param {EditorConfig} config
	 */
	createDOM(config) {
		const dom = super.createDOM(config);

		// Links parsed without a target (JSON from before isInternal existed) open externally.
		if (!this.getIsInternal() && !dom.getAttribute('target')) {
			dom.setAttribute('target', '_blank');
		}

		// For internal links, we need to reload the page to make the ToC update.
		if (!dom.getAttribute('target')) {
			dom.setAttribute('data-sveltekit-reload', 'true');
		}

		return dom;
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
