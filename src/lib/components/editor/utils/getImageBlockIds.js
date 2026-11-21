import { $nodesOfType } from 'lexical';
import { ImageNode } from '$lib/lexical/custom';
import { $closestBlockId } from './closestBlockId';

/**
 * The blocks holding images with these sources.
 * @param {LexicalEditor} editor
 * @param {string[]} sources
 */
export const getImageBlockIds = (editor, sources) =>
	editor.read(() => {
		/** @type {Set<string>} */
		const ids = new Set();

		for (const image of $nodesOfType(ImageNode)) {
			const src = image.getSrc();
			const id = src && sources.includes(src) ? $closestBlockId(image) : null;

			if (id) {
				ids.add(id);
			}
		}

		return [...ids];
	});
