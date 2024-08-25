import crypto from 'crypto';
import { $nodesOfType as nodesOfType } from 'lexical';

import { ImageNode } from '$lib/lexicalCustom';
import { MAX_IMAGE_SIZE_MIB } from '$lib/constants/image';
import { cacheServiceBaseURLWithStatic, getCacheURL } from '$lib/utils/getCacheURL';
import { createContent } from '$lib/db/content/create';
import { writeContent } from '$lib/fs/content';
import { IMAGE_OFF } from '../plugins/Image/Image';

/**
 * @param {string} base64String
 */
function calculateOriginalFileSizeInMiB(base64String) {
	// Scuffed.
	const paddingCharacters = (base64String.match(/=+$/) || [''])[0].length;

	const base64Length = base64String.length - paddingCharacters;

	const originalSize = (base64Length * 3) / 4;

	return originalSize / 1048576;
}

/**
 * @param {string} base64String
 */
function sha256FromBase64(base64String) {
	const stripped = base64String.split(',')[1];
	const buffer = Buffer.from(stripped, 'base64');

	const hash = crypto.createHash('sha256').update(buffer).digest('hex');

	return hash;
}

/**
 * @param {string} base64String
 * @param {string} title
 * @param {string} sha256String
 * @param {Pick<Prisma.User, 'id'>} author
 */
const uploadImage = async (base64String, title, sha256String, author) => {
	const stripped = base64String.split(',')[1];
	const buffer = Buffer.from(stripped, 'base64');

	try {
		await writeContent(buffer, sha256String);
		await createContent({ name: title, hash: sha256String, authorId: author.id });
	} catch (error) {
		console.warn(error);
	}
};

/**
 * @param {LexicalEditor} editor
 * @param {string} title
 * @param {Pick<Prisma.User, 'id'>} author
 * @throws {string}
 */
export const adjustAndUploadImages = (editor, title, author) => {
	return new Promise((resolve, reject) => {
		editor.update(
			async () => {
				const images = nodesOfType(ImageNode);
				if (!images.length) {
					return resolve(null);
				}

				for (let index = 0; index < images.length; index++) {
					const image = images[index];

					const src = image.getSrc();

					// TODO: Revisit image sizes.
					// const height = image.__height;
					// const width = image.__width;
					// image.setWidthAndHeight(typeof width === 'number' ? Math.min(width, 500) : 500, typeof height === 'number' ? Math.min(height, 500) : 500);

					if (src.startsWith('data:') && calculateOriginalFileSizeInMiB(src) > MAX_IMAGE_SIZE_MIB) {
						image.setSrc(IMAGE_OFF);
						return reject(`Image too large: {${image.getKey()}}`);
					}

					if (src.startsWith('data:')) {
						const hash = sha256FromBase64(src);
						// Upload image to static folder.
						const newTitle = `${title}-${index}`;
						uploadImage(src, newTitle, hash, author);

						// Assume the image will be successfully uploaded to our server.
						const url = getCacheURL(hash, title, { width: image.__width, height: image.__height });

						// Set image src to cache.
						image.setSrc(url.toString());
						continue;
					}

					if (src.startsWith(cacheServiceBaseURLWithStatic)) {
						const url = new URL(src);

						// Resize image if user has changed it.
						if (
							url.searchParams.get('w') !== String(image.__width) ||
							url.searchParams.get('h') !== String(image.__height)
						) {
							url.searchParams.set('w', String(image.__width));
							url.searchParams.set('h', String(image.__height));

							// Set image src to cache.
							image.setSrc(url.toString());
							continue;
						}
					}

					// Unset any images that aren't base64.
					if (!src.startsWith(cacheServiceBaseURLWithStatic)) {
						image.setSrc(IMAGE_OFF);
					}
				}

				resolve(null);
			},
			{ discrete: true }
		);
	});
};
