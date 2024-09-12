import { TextNode } from 'lexical';

/**
 * @typedef {import("lexical").NodeKey} NodeKey
 * @typedef {import("lexical").LexicalEditor} LexicalEditor
 * @typedef {import("lexical").EditorConfig} EditorConfig
 */

export class DiffTextNode extends TextNode {
	/** @type {string | { __old: string, __new: string, diff: import('diff').Change[] }} */
	// @ts-ignore
	__text = '';

	/** @type {' ' | '~' | '+' | '-'} */
	___change;

	/**
	 *
	 * @param {TextNode} node
	 * @param {NodeKey} [key]
	 */
	constructor(node, key) {
		super(node.__text, key);
		
		this.setTextContent(node.__text);
		this.setFormat(node.getFormat());
		this.setDetail(node.getDetail());
		this.setMode(node.getMode());
		this.setStyle(node.getStyle());

		this.__text = node.__text;

		// @ts-ignore
		this.___change = node.___change;
	}

	/**
	 * @param {DiffTextNode} node
	 */
	static clone(node) {
		// @ts-ignore
		return new DiffTextNode(node, node.__key);
	}

	static getType() {
		return 'diff-text';
	}

	/**
	 * @param {LexicalEditor} editor
	 */
	exportDOM(editor) {
		const dom = super.exportDOM(editor);

		if (typeof this.__text === 'object' && dom.element) {
			dom.element.textContent = '';

			const { diff } = this.__text;

			for (let index = 0; index < diff.length; index++) {
				const { value, added, removed } = diff[index];
				
				const span = document.createElement('span');

				span.textContent = value;

				if (removed) {
					span.style.color = 'red';
				}

				if (added) {
					span.style.color = 'green';
				}

				dom.element.appendChild(span);
			}
		}

		return dom;
	}

	/**
	 * @param {any} serializedNode
	 */
	static importJSON(serializedNode) {
		const textNode = TextNode.importJSON(serializedNode);
		const node = new DiffTextNode(textNode);

		return node;
	}

	exportJSON() {
		return { ...super.exportJSON(), type: this.getType() };
	}
}

/**
 * @param {TextNode} node
 */
export function $createDiffTextNode(node) {
	return new DiffTextNode(node);
}
