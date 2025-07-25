// @ts-ignore
import { TextNode } from 'lexical';
import { applyCSSColorDiff } from './utils';

/**
 * @typedef {import('lexical').NodeKey} NodeKey
 * @typedef {import('lexical').LexicalEditor} LexicalEditor
 * @typedef {import('lexical').EditorConfig} EditorConfig
 *
 * @typedef {import('lexical').SerializedTextNode} SerializedTextNode
 */

export class DiffTextNode extends TextNode {
	/** @type {import('./Types').___ChangeTextNode} */
	___change;

	/**
	 *
	 * @param {SerializedTextNode | DiffTextNode} node
	 * @param {NodeKey} [key]
	 */
	constructor(node, key) {
		// @ts-ignore
		super(node.text || node.__text, key);

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
	 * @param {SerializedTextNode} serializedNode
	 */
	static importJSON(serializedNode) {
		const node = $createDiffTextNode(serializedNode).updateFromJSON(serializedNode);
		return node;
	}

	/**
	 * @param {LexicalEditor} editor
	 */
	exportDOM(editor) {
		const dom = super.exportDOM(editor);

		if (
			typeof this.___change === 'object' &&
			dom.element &&
			typeof this.___change.text?.diff === 'object'
		) {
			dom.element.textContent = '';

			const {
				text: { diff },
			} = this.___change;

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

				// TODO: Does this ever happen?
				if (added && removed) {
					span.style.color = 'orange';
				}

				dom.element.appendChild(span);
			}
		} else if (
			typeof this.___change === 'object' &&
			dom.element instanceof HTMLElement &&
			this.___change.___type
		) {
			applyCSSColorDiff(dom.element, this.___change.___type);
		}

		return dom;
	}

	static importDOM() {
		return TextNode.importDOM();
	}

	exportJSON() {
		return { ...super.exportJSON(), ___change: this.___change, type: DiffTextNode.getType() };
	}
}

/**
 * @param {SerializedTextNode} node
 */
export function $createDiffTextNode(node) {
	return new DiffTextNode(node);
}
