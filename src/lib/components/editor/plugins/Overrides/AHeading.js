import { $applyNodeReplacement } from 'lexical';
import { HeadingNode } from '$lib/lexical/index';

export class AHeadingNode extends HeadingNode {
  $config() {
    return this.config('a-heading', { extends: HeadingNode });
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

	static importDOM() {
		return HeadingNode.importDOM();
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
