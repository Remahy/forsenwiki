import { $getBlockId } from '@lexical/extension';
import { $isRootNode } from 'lexical';

/**
 * The node's own block, such as an image in a gallery, or the paragraph, list item or cell around it.
 * @param {LexicalNode} node
 * @returns {string | null}
 */
export const $closestBlockId = (node) => {
	for (
		let at = /** @type {LexicalNode | null} */ (node);
		at && !$isRootNode(at);
		at = at.getParent()
	) {
		const id = $getBlockId(at);

		if (id !== null) {
			return id;
		}
	}

	return null;
};
