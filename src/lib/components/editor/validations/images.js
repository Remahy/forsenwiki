import { $nodesOfType as nodesOfType } from 'lexical';

import { $isGalleryNode as isGalleryNode, ImageNode } from '$lib/lexical/custom';
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
				const nodes = nodesOfType(ImageNode);
				if (!nodes.length) {
					return resolve(false);
				}

				for (let index = 0; index < nodes.length; index++) {
					const node = nodes[index];

					const src = node.getSrc();

					if (src?.startsWith('data:')) {
						return reject(
							`Image index [${index + 1}]: One of your images was uploaded as an encoded base64 string. Not allowed.`
						);
					}

					// Unset any image that does not start with the cache service.
					if (src?.startsWith('https://') || src?.startsWith('http://')) {
						return reject(
							`Image index [${index + 1}]: One of your images is inserted as a link. Not allowed.`
						);
					}

					let { width, height } = node.getWidthAndHeight();

					// TODO: Revisit image sizes.
					width =
						typeof width === 'number'
							? Math.min(Math.max(IMAGE_MIN_WIDTH, Math.round(width)), IMAGE_MAX_WIDTH)
							: width;
					height =
						typeof height === 'number'
							? Math.min(Math.max(IMAGE_MIN_HEIGHT, Math.round(height)), IMAGE_MAX_HEIGHT)
							: height;

					const isParentGallery = isGalleryNode(node.getParent());

					if (isParentGallery) {
						width = 'inherit';
						height = 'inherit';
					}

					node.setWidthAndHeight({
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
