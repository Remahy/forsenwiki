import { HeadingNode } from '$lib/lexical/index';
import { isHTMLElement } from 'lexical';

/**
 * @type {[import("lexical").Klass<LexicalNode>, (editor: LexicalEditor, target: LexicalNode) => import("lexical").DOMExportOutput]}
 */
export default [
	HeadingNode,
	(editor, node) => {
		const output = node.exportDOM(editor);

		const text = node.getTextContent().slice(0, 32);

		if (output && isHTMLElement(output.element)) {
			const { element } = output;

			element.id = text
				.replace(/[^\w]+/g, ' ')
				.trim()
				.replace(/ /g, '-');
		}

		return output;
	},
];
