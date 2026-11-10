import { HeadingNode } from '$lib/lexical/index';
import { $getBlockId } from '@lexical/extension';
import { $nodesOfType, isHTMLElement } from 'lexical';

/**
 * @param {LexicalNode} node
 */
const slugify = (node) =>
	node
		.getTextContent()
		.slice(0, 32)
		.replace(/[^\w]+/g, ' ')
		.trim()
		.replace(/ /g, '-');

/**
 * The first heading with a given slug keeps the bare slug, so existing links still work.
 * @param {HeadingNode} node
 */
const $getHeadingAnchor = (node) => {
	const slug = slugify(node);
	const blockId = $getBlockId(node);

	if (!blockId) {
		return slug;
	}

	if (!slug) {
		return blockId;
	}

	const isFirst = $nodesOfType(HeadingNode).every(
		(other) => other.is(node) || slugify(other) !== slug || !other.isBefore(node)
	);

	return isFirst ? slug : `${slug}-${blockId}`;
};

/**
 * @type {[import("lexical").Klass<LexicalNode>, (editor: LexicalEditor, target: LexicalNode) => import("lexical").DOMExportOutput]}
 */
export default [
	HeadingNode,
	(editor, node) => {
		const output = node.exportDOM(editor);

		if (output && isHTMLElement(output.element)) {
			output.element.id = $getHeadingAnchor(/** @type {HeadingNode} */ (node));
		}

		return output;
	},
];
