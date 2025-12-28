import { TableCellNode } from '$lib/lexical/index';
import { isHTMLElement } from 'lexical';

/**
 * @type {[import("lexical").Klass<LexicalNode>, (editor: LexicalEditor, target: LexicalNode) => import("lexical").DOMExportOutput]}
 */
export default [
	TableCellNode,
	(editor, node) => {
		const output = node.exportDOM(editor);

		if (output && isHTMLElement(output.element)) {
			const { element } = output;

			element.style.border = '';
			element.style.removeProperty('border');
			element.style.backgroundColor = '';
			element.style.removeProperty('background-color');
		}

		return output;
	},
];
