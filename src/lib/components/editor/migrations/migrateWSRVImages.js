import { $nodesOfType as nodesOfType, $getNodeFromDOMNode as getNodeFromDOMNode } from 'lexical';
import { ImageNode, $isImageNode as isImageNode } from '$lib/lexical/custom';

/**
 * @param {ImageNode} image
 */
const migrateWSRVImage = (image) => {
	const src = image.getSrc();

	if (src?.startsWith('https://wsrv.nl/?url=https%3A%2F%2Fforsen.wiki')) {
		const url = new URL(src);
		const urlUrl = url.searchParams.get('url') || '';
		const hash = urlUrl.split('/').pop();

		image.setSrc(hash);
	}
};

/**
 * @param {LexicalEditor} editor
 * @param {HTMLElement} element
 */
export const migrateWSRVImageUsingElement = async (editor, element) => {
	return editor.update(
		() => {
			const node = getNodeFromDOMNode(element);

			if (isImageNode(node)) {
				migrateWSRVImage(node);
			}
		},
		{ tag: 'history-merge' }
	);
};

/**
 * @param {LexicalEditor} editor
 */
export const migrateWSRVImages = (editor) => {
	return editor.update(
		() => {
			const images = nodesOfType(ImageNode);
			if (!images.length) {
				return;
			}

			for (let index = 0; index < images.length; index++) {
				const image = images[index];

				migrateWSRVImage(image);
			}
		},
		{ tag: 'history-merge', discrete: true }
	);
};
