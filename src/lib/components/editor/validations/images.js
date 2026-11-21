import { $nodesOfType as nodesOfType } from 'lexical';

import { $isGalleryNode as isGalleryNode, ImageNode } from '$lib/lexical/custom';
import { InvalidArticleError } from '$lib/errors/InvalidArticle';
import { $closestBlockId } from '../utils/closestBlockId';
import {
	IMAGE_MAX_HEIGHT,
	IMAGE_MAX_WIDTH,
	IMAGE_MIN_HEIGHT,
	IMAGE_MIN_WIDTH,
} from '$lib/constants/image';

/**
 * @param {number} count
 * @param {string} singular
 * @param {string} plural
 */
const images = (count, singular, plural) =>
	count === 1 ? `An image ${singular}.` : `${count} images ${plural}.`;

/**
 * @param {LexicalEditor} editor
 * @throws {InvalidArticleError} Images inserted as base64 or as a link, all of them.
 */
export const adjustImages = (editor) => {
	return new Promise((resolve, reject) => {
		const invalid = { base64: 0, links: 0 };
		/** @type {Set<string>} */
		const blockIds = new Set();

		editor.update(
			() => {
				const nodes = nodesOfType(ImageNode);
				if (!nodes.length) {
					return resolve(false);
				}

				for (let index = 0; index < nodes.length; index++) {
					const node = nodes[index];

					const src = node.getSrc();

					const isBase64 = src?.startsWith('data:');
					const isLink = src?.startsWith('https://') || src?.startsWith('http://');

					if (isBase64 || isLink) {
						invalid[isBase64 ? 'base64' : 'links']++;

						const id = $closestBlockId(node);
						if (id) {
							blockIds.add(id);
						}

						continue;
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

		if (invalid.base64 || invalid.links) {
			const count = invalid.base64 + invalid.links;
			const message = [
				invalid.base64 &&
					images(invalid.base64, 'is an encoded base64 string', 'are encoded base64 strings'),
				invalid.links && images(invalid.links, 'is inserted as a link', 'are inserted as links'),
			]
				.filter(Boolean)
				.join(' ');

			return reject(
				new InvalidArticleError(`${message} Upload ${count === 1 ? 'it' : 'them'} instead.`, {
					blockIds: [...blockIds],
					blockLabel: 'image',
				})
			);
		}

		resolve(true);
	});
};
