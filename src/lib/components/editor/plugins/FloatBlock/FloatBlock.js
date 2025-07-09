import { $applyNodeReplacement, ElementNode } from 'lexical';
import { FLOATBLOCK_MIN_HEIGHT, FLOATBLOCK_MIN_WIDTH, floatValues } from '$lib/constants/floatBlock';

const startValues = ['left', 'inline-start', 'none', undefined];
// const endValues = ['right', 'inline-end'];

/**
 * @param {any} number
 * @param {number} min
 */
const setNumberOrUndefined = (number, min) => {
	const value =
		typeof number !== 'number' ? (Number.isNaN(Number(number)) ? undefined : Number(number)) : number;

	return typeof value === 'number' ? Math.max(min, value) : undefined;
};

/**
 * @typedef {import('lexical').NodeKey} NodeKey
 * @typedef {import('lexical').SerializedElementNode} SerializedElementNode
 * @typedef {import('lexical').EditorConfig} EditorConfig
 *
 * @typedef {('none' | 'left' | 'right' | 'inline-start' | 'inline-end'| undefined)} FloatValue
 * @typedef {SerializedElementNode & { float: FloatValue, width?: number, height?: number, type: ReturnType<FloatBlockNode.getType> }} SerializedFloatBlockNode
 */

/**
 * @typedef {{ float?: FloatValue, width?: number, height?: number }} FloatBlockNodePayload
 */

export class FloatBlockNode extends ElementNode {
	/** @type {FloatValue} */
	__float;

	/** @type {number | undefined} */
	__width;;

	/** @type {number | undefined} */
	__height;;

	/**
	 * @param {FloatValue} float
	 * @param {number} [width]
	 * @param {number} [height]
	 * @param {NodeKey} [key]
	 */
	constructor(float, width, height, key) {
		super(key);

		this.__float = float;
		this.__width = width;
		this.__height = height;
	}

	static getType() {
		return 'float-block';
	}

	/**
	 * @param {FloatBlockNode} node
	 */
	static clone(node) {
		return new FloatBlockNode(node.__float, node.__width, node.__height, node.__key);
	}

	/** @param {SerializedFloatBlockNode} serializedNode */
	static importJSON(serializedNode) {
		const node = new FloatBlockNode(
			serializedNode.float,
			serializedNode.width,
			serializedNode.height
		);

		node.setDirection(serializedNode.direction);
		node.setFormat(serializedNode.format);
		node.setIndent(serializedNode.indent);

		return node;
	}

	/**
	 * @param {FloatValue} float
	 */
	setFloat(float) {
		const self = this.getWritable();
		self.__float = float && floatValues.includes(float) ? float : undefined;
	}

	getFloat() {
		const self = this.getLatest();
		const float = self.__float;
		return float && floatValues.includes(float) ? float : undefined;
	}

	/**
	 * @param {number?} width
	 */
	setWidth(width) {
		const self = this.getWritable();
		self.__width = width != null ? setNumberOrUndefined(width, FLOATBLOCK_MIN_WIDTH) : undefined;
	}

	getWidth() {
		const self = this.getLatest();
		const value = self.__width;
		return value;
	}

	/**
	 * @param {number?} height
	 */
	setHeight(height) {
		const self = this.getWritable();
		self.__height = height != null ? setNumberOrUndefined(height, FLOATBLOCK_MIN_HEIGHT) : undefined;
	}

	getHeight() {
		const self = this.getLatest();
		const value = self.__height;
		return value;
	}

	/**
	 * @returns {SerializedFloatBlockNode}
	 */
	exportJSON() {
		return {
			...super.exportJSON(),
			float: this.getFloat(),
			width: this.getWidth(),
			height: this.getHeight(),
			type: FloatBlockNode.getType(),
		};
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

		const { floatBlockNodeBoxShadow = null } = config?.theme || {};
		if (floatBlockNodeBoxShadow) {
			dom.style.boxShadow = floatBlockNodeBoxShadow;
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
