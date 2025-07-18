import { $applyNodeReplacement } from 'lexical';
import { HeadingNode } from '$lib/lexical/index';
import { $createHeadingNode } from 'svelte-lexical';

export class AHeadingNode extends HeadingNode {
	/**
	 * @param {import('@lexical/rich-text').HeadingTagType} tag
	 * @param {string} [key]
	 */
	constructor(tag, key) {
		super(tag, key);
	}

	static getType() {
		return 'a-heading';
	}

	/**
	 * @param {AHeadingNode} node
	 */
	static clone(node) {
		return new AHeadingNode(node.__tag, node.__key);
	}

	/** @param {import('@lexical/rich-text').SerializedHeadingNode} serializedNode */
	static importJSON(serializedNode) {
		const node = $createHeadingNode().updateFromJSON(serializedNode);

		return node;
	}

	/**
	 * @param {LexicalEditor} editor
	 */
	exportDOM(editor) {
		const dom = super.exportDOM(editor);

		const text = this.getTextContent().slice(0, 32);

		if (dom.element instanceof HTMLElement) {
			dom.element.id = text
				.replace(/[^\w]+/g, ' ')
				.trim()
				.replace(/ /g, '-');
		}

		return dom;
	}

	exportJSON() {
		return {
			...super.exportJSON(),
			type: AHeadingNode.getType(),
		};
	}
}

/**
 * @param {import('@lexical/rich-text').HeadingTagType} tag
 * @param {string} [key]
 */
export function $createAHeadingNode(tag, key) {
	return $applyNodeReplacement(new AHeadingNode(tag, key));
}
