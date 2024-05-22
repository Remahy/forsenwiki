import { $nodesOfType } from 'lexical';

import { ImageNode } from "$lib/lexical";
import { MAX_IMAGE_SIZE_MIB } from '$lib/constants/image';
import { IMAGE_OFF } from '../plugins/Image';

/**
 * @param {string} base64String 
 */
function calculateOriginalFileSizeInMiB(base64String) {
	const paddingCharacters = (base64String.match(/=+$/) || [''])[0].length;

	const base64Length = base64String.length - paddingCharacters;

	const originalSize = (base64Length * 3) / 4;

	return originalSize / 1048576;
}


/**
 * @param {LexicalEditor} editor
 * @throws {string}
 */
export const validateAndUploadImages = (editor) => {
	return new Promise((resolve, reject) => {
		editor.update(async () => {
			const images = $nodesOfType(ImageNode);
			if (!images.length) {
				return resolve(null);
			}

			for (let index = 0; index < images.length; index++) {
				const image = images[index];

				const src = image.getSrc();

				if (src.startsWith('data:') && calculateOriginalFileSizeInMiB(src) > MAX_IMAGE_SIZE_MIB) {
					image.setSrc(IMAGE_OFF);
					reject(`Image too large: {${image.getKey()}}`);
					return;
				}

				if (src.startsWith('data:')) {
					continue;
				}

				// Unset any images that aren't base64.
				if (!src.startsWith('/static/')) {
					image.setSrc(IMAGE_OFF);
				}

				// TODO: Revisit image sizes.
				// const height = image.__height;
				// const width = image.__width;
				// image.setWidthAndHeight(typeof width === 'number' ? Math.min(width, 500) : 500, typeof height === 'number' ? Math.min(height, 500) : 500);
			}

			resolve(null);
		}, { discrete: true });
	})
}
