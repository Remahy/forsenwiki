import { $applyNodeReplacement, ElementNode } from 'lexical';
import { FLOATBLOCK_MIN_HEIGHT, FLOATBLOCK_MIN_WIDTH, floatValues } from '$lib/constants/floatBlock';

const startValues = ['left', 'inline-start', null, 'none'];
// const endValues = ['right', 'inline-end'];

/**
 * @param {any} number
 * @param {number} min
 */
const setNumberOrNull = (number, min) => {
	const value =
		typeof number !== 'number' ? (Number.isNaN(Number(number)) ? null : Number(number)) : number;

	return typeof value === 'number' ? Math.max(min, value) : null;
};

/**
 * @typedef {import('lexical').NodeKey} NodeKey
 * @typedef {import('lexical').SerializedElementNode} SerializedElementNode
 * @typedef {import('lexical').EditorConfig} EditorConfig
 *
 * @typedef {('none' | 'left' | 'right' | 'inline-start' | 'inline-end')?} FloatValue
 * @typedef {SerializedElementNode & { float: FloatValue, width: number | null, height: number | null, type: ReturnType<FloatBlockNode.getType> }} SerializedFloatBlockNode
 */

/**
 * @typedef {{ float: FloatValue, width: number?, height: number? }} FloatBlockNodePayload
 */

export class FloatBlockNode extends ElementNode {
	/** @type {FloatValue} */
	__float;

	/** @type {number?} */
	__width = null;

	/** @type {number?} */
	__height = null;

	/**
	 * @param {FloatValue} float
	 * @param {number?} width
	 * @param {number?} height
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
		self.__float = floatValues.includes(float) ? float : null;
	}

	getFloat() {
		const self = this.getLatest();
		const float = self.__float;
		return floatValues.includes(float) ? float : null;
	}

	/**
	 * @param {number?} width
	 */
	setWidth(width) {
		const self = this.getWritable();
		self.__width = width != null ? setNumberOrNull(width, FLOATBLOCK_MIN_WIDTH) : null;
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
		self.__height = height != null ? setNumberOrNull(height, FLOATBLOCK_MIN_HEIGHT) : null;
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
			version: 1,
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
}

/** @param {FloatBlockNodePayload & { key?: NodeKey }} arg1 */
export function $createFloatBlockNode({ float, width, height, key }) {
	return $applyNodeReplacement(new FloatBlockNode(float, width, height, key));
}

/**
 * @param {any} node
 * @returns {node is FloatBlockNode}
 */
export function $isFloatBlockNode(node) {
	return node instanceof FloatBlockNode;
}
