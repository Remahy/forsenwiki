import { HeadingNode } from '@lexical/rich-text';
import { addInformationHover, applyCSSColorDiff } from './utils';

/**
 * @typedef {import("lexical").NodeKey} NodeKey
 * @typedef {import("lexical").LexicalEditor} LexicalEditor
 * @typedef {import("lexical").EditorConfig} EditorConfig
 */

export class DiffAHeadingNode extends HeadingNode {
	/** @type {import('./Types').___Change} */
	___change;

	/**
	 * @param {HeadingNode} node
	 * @param {NodeKey} [key]
	 */
	constructor(node, key) {
		super(node.__tag, key);

		this.setDirection(node.getDirection());
		this.setFormat(node.getFormatType());
		this.setIndent(node.getIndent());
		this.setStyle(node.getStyle());

		// @ts-ignore
		this.___change = node.___change;
	}

	/**
	 * @param {DiffAHeadingNode} node
	 */
	static clone(node) {
		return new DiffAHeadingNode(node, node.__key);
	}

	static getType() {
		return 'diff-a-heading';
	}

	/**
	 * @param {import('@lexical/rich-text').SerializedHeadingNode} serializedNode
	 */
	static importJSON(serializedNode) {
		const heading = HeadingNode.importJSON(serializedNode);

		// @ts-ignore
		heading.___change = serializedNode.___change;

		const node = new DiffAHeadingNode(heading);
		return node;
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
		return { ...super.exportJSON(), type: DiffAHeadingNode.getType() };
	}
}

// /**
//  * @param {HeadingNode} node
//  */
// export function $createDiffAHeadingNode(node) {
// 	return new DiffAHeadingNode(node);
// }
