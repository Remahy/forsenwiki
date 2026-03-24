import { $nodesOfType as nodesOfType } from 'lexical';
import { ImageNode } from '$lib/lexical/custom';

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

				const src = image.getSrc();

				if (src?.startsWith('https://wsrv.nl/?url=https%3A%2F%2Fforsen.wiki')) {
					const url = new URL(src);
					const urlUrl = url.searchParams.get('url') || '';
					const hash = urlUrl.split('/').pop();

					image.setSrc(hash);
				}
			}
		},
		{ tag: 'history-merge' }
	);
};
