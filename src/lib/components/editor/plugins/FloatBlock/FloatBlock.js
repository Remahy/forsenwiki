import { $applyNodeReplacement, ElementNode } from 'lexical';
import {
	FLOATBLOCK_MIN_HEIGHT,
	FLOATBLOCK_MIN_WIDTH,
	floatValues,
} from '$lib/constants/floatBlock';

const startValues = ['left', 'inline-start', 'none', undefined];
// const endValues = ['right', 'inline-end'];

/**
 * @param {any} number
 * @param {number} min
 */
const setNumberOrUndefined = (number, min) => {
	const value =
		typeof number !== 'number'
			? Number.isNaN(Number(number))
				? undefined
				: Number(number)
			: number;

	return typeof value === 'number' ? Math.max(min, value) : undefined;
};

/**
 * @typedef {import('lexical').NodeKey} NodeKey
 * @typedef {import('lexical').SerializedElementNode} SerializedElementNode
 * @typedef {import('lexical').EditorConfig} EditorConfig
 *
 * @typedef {('none' | 'left' | 'right' | 'inline-start' | 'inline-end' | undefined)} FloatValue
 * @typedef {SerializedElementNode & { float: FloatValue, width?: number, height?: number, type: string }} SerializedFloatBlockNode
 */

/**
 * @typedef {{ float?: FloatValue, width?: number, height?: number }} FloatBlockNodePayload
 */

export class FloatBlockNode extends ElementNode {
	/** @type {FloatValue} */
	__float;

	/** @type {number | undefined} */
	__width;

	/** @type {number | undefined} */
	__height;

	/**
	 * @param {FloatValue} [float]
	 * @param {number} [width]
	 * @param {number} [height]
	 * @param {NodeKey} [key]
	 */
	constructor(float = 'none', width, height, key) {
		super(key);

		this.__float = float;
		this.__width = width;
		this.__height = height;
	}

	static getType() {
		return 'float-block';
	}

	$config() {
		return this.config('float-block', { extends: ElementNode });
	}

	/**
	 * @param {FloatBlockNode} node
	 */
	static clone(node) {
		return new FloatBlockNode(node.__float, node.__width, node.__height, node.__key);
	}

	/** @param {SerializedFloatBlockNode} serializedNode */
	static importJSON(serializedNode) {
		const node = $createFloatBlockNode(serializedNode).updateFromJSON(serializedNode);

		return node;
	}

	/**
	 *
	 * @returns {SerializedFloatBlockNode}
	 */
	exportJSON() {
		return {
			...super.exportJSON(),
			float: this.getFloat(),
			type: FloatBlockNode.getType(),
			width: this.getWidth(),
			height: this.getHeight(),
		};
	}

	/**
	 * @param {FloatValue} float
	 */
	setFloat(float) {
		const self = this.getWritable();

		if (!float || !floatValues.includes(float)) {
			self.__float = 'none';
			return this;
		}

		self.__float = float;

		return this;
	}

	getFloat() {
		const self = this.getLatest();
		const float = self.__float;

		if (!float || !floatValues.includes(float)) {
			return 'none';
		}

		return float;
	}

	/**
	 * @param {number | undefined} width
	 */
	setWidth(width) {
		const self = this.getWritable();
		self.__width = width != null ? setNumberOrUndefined(width, FLOATBLOCK_MIN_WIDTH) : undefined;

		return this;
	}

	getWidth() {
		const self = this.getLatest();
		const value = self.__width;
		return value;
	}

	/**
	 * @param {number | undefined} height
	 */
	setHeight(height) {
		const self = this.getWritable();
		self.__height =
			height != null ? setNumberOrUndefined(height, FLOATBLOCK_MIN_HEIGHT) : undefined;

		return this;
	}

	getHeight() {
		const self = this.getLatest();
		const value = self.__height;
		return value;
	}

	/**
	 * @param {EditorConfig} config
	 */
	createDOM(config) {
		const div = document.createElement('div');

		this.updateDOM(null, div, config);

		return div;
	}

	// We don't need to define exportDOM method ourselves here, since Lexical calls createDOM in the super's exportDOM.

	/**
	 * @param {FloatBlockNode | null} _
	 * @param {HTMLDivElement} dom
	 * @param {EditorConfig?} config
	 */
	updateDOM(_, dom, config) {
		const float = this.getFloat();

		dom.style.float = float || 'none';

		if (startValues.includes(float)) {
			dom.style.marginInlineEnd = '8px';
		} else {
			dom.style.marginInlineStart = '8px';
		}

		const { floatBlockNodeBoxShadow = null, floatResponsive = null } = config?.theme || {};
		if (floatBlockNodeBoxShadow) {
			dom.style.boxShadow = floatBlockNodeBoxShadow;
		}
		if (floatResponsive) {
			dom.classList.add(floatResponsive);
		}

		dom.style.overflow = 'hidden';

		const width = this.getWidth();
		if (width != null) {
			dom.style.width = typeof width === 'number' ? `${width}px` : width;
		} else {
			dom.style.removeProperty('width');
		}
		dom.style.minWidth = `${FLOATBLOCK_MIN_WIDTH}px`;

		const height = this.getHeight();
		if (height != null) {
			dom.style.height = typeof height === 'number' ? `${height}px` : height;
		} else {
			dom.style.removeProperty('height');
		}
		dom.style.minHeight = `${FLOATBLOCK_MIN_HEIGHT}px`;

		return false;
	}

	isShadowRoot() {
		return true;
	}
}

/** @param {FloatBlockNodePayload & { key?: NodeKey }} [payload] */
export function $createFloatBlockNode(payload) {
	const { float, width, height, key } = payload || {};
	return $applyNodeReplacement(new FloatBlockNode(float, width, height, key));
}

/**
 * @param {any} node
 * @returns {node is FloatBlockNode}
 */
export function $isFloatBlockNode(node) {
	return node instanceof FloatBlockNode;
}
