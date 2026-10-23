import { $nodesOfType as nodesOfType } from 'lexical';
import { ImageNode } from '$lib/lexical/custom';

/**
 * @param {LexicalEditor} editor
 */
export const getUniqueImageHashes = (editor) => {
	return editor.read(() => {
		/**
		 * @type {Array<string>}
		 */
		const srcArr = [];

		const images = nodesOfType(ImageNode);
		if (!images.length) {
			return srcArr;
		}

		for (let index = 0; index < images.length; index++) {
			const image = images[index];

			const src = image.getSrc();

			if (!src || srcArr.includes(src)) {
				continue;
			}

			srcArr.push(src);
		}

		return srcArr;
	});
};
