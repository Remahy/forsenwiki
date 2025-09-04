import { HeadingNode } from '$lib/lexical/index';
import { isHTMLElement } from 'lexical';

/**
 * @type {[import("lexical").Klass<LexicalNode>, (editor: LexicalEditor, target: LexicalNode) => import("lexical").DOMExportOutput]}
 */
export default [
	HeadingNode,
	(editor, node) => {
		const dom = node.exportDOM(editor);

		const text = node.getTextContent().slice(0, 32);

		if (isHTMLElement(dom.element)) {
			dom.element.id = text
				.replace(/[^\w]+/g, ' ')
				.trim()
				.replace(/ /g, '-');
		}

		return dom;
	},
];
