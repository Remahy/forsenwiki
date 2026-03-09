import { $nodesOfType as nodesOfType } from 'lexical';

import { ImageNode } from '$lib/lexical/custom';
import {
	IMAGE_MAX_HEIGHT,
	IMAGE_MAX_WIDTH,
	IMAGE_MIN_HEIGHT,
	IMAGE_MIN_WIDTH,
} from '$lib/constants/image';

/**
 * @param {LexicalEditor} editor
 * @throws {string}
 */
export const adjustImages = (editor) => {
	return new Promise((resolve, reject) => {
		editor.update(
			() => {
				const images = nodesOfType(ImageNode);
				if (!images.length) {
					return resolve(false);
				}

				for (let index = 0; index < images.length; index++) {
					const image = images[index];

					const src = image.getSrc();

					if (src?.startsWith('data:')) {
						return reject(
							`Image index [${index}]: One of your images was uploaded as an encoded base64 string. Not allowed.`
						);
					}

					// Unset any image that does not start with the cache service.
					if (src?.startsWith('https://') || src?.startsWith('http://')) {
						return reject(
							`Image index [${index}]: One of your images is inserted as a link. Not allowed.`
						);
					}

					let { width, height } = image.getWidthAndHeight();

					// TODO: Revisit image sizes.
					width =
						typeof width === 'number'
							? Math.min(Math.max(IMAGE_MIN_WIDTH, Math.round(width)), IMAGE_MAX_WIDTH)
							: width;
					height =
						typeof height === 'number'
							? Math.min(Math.max(IMAGE_MIN_HEIGHT, Math.round(height)), IMAGE_MAX_HEIGHT)
							: height;

					image.setWidthAndHeight({
						width,
						height,
					});

					// TODO: Check if image has been uploaded to S3 successfully, otherwise warn user.
				}
			},
			{ discrete: true }
		);

		resolve(true);
	});
};
