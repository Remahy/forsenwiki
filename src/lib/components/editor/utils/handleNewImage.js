import { IMAGE_MAX_HEIGHT, IMAGE_MAX_WIDTH } from '$lib/constants/image';
import { ErrorWithCode } from '$lib/errors/ErrorWithCode';
import { getImageCacheURL } from '$lib/utils/getImageCacheURL';
import { checkFile, FileErrorCodes } from './handleNewFile';

/**
 * @param {File} f
 * @param {boolean} [isModerator]
 * @returns {Promise<{ linkType: 'external' | 'internal', src: string, file?: File, name: string, width: number, height: number, hash: string }>}
 * @throws {ErrorWithCode}
 */
export const handleNewImage = async (f, isModerator = false) => {
	const { file, fileReader, hash, name, res } = await checkFile(f, isModerator);

	const img = new Image();

	return new Promise((resolve, reject) => {
		fileReader.addEventListener('load', () => {
			if (typeof fileReader.result === 'string') {
				img.src = fileReader.result;
			}
		});

		fileReader.addEventListener('error', () => {
			const error = new ErrorWithCode(fileReader.error?.message);
			error.code = FileErrorCodes.GENERIC;
			reject(error);
		});

		img.onload = async () => {
			if (res.status === 200) {
				const content = await res.json();
				// Take me to "Browse" and search for content.name
				resolve({
					linkType: 'internal',
					src: getImageCacheURL(hash).toString(),
					name: content.name,
					hash,
					width: img.width,
					height: img.height,
				});
				return;
			}

			if (img.width > IMAGE_MAX_WIDTH) {
				const error = new ErrorWithCode(
					`Width is too large. Max is ${IMAGE_MAX_WIDTH}x${IMAGE_MAX_HEIGHT} (${IMAGE_MAX_WIDTH}). Uploaded width size: ${img.width}`
				);
				error.code = FileErrorCodes.DIMENSIONS_TOO_LARGE;
				reject(error);
				return;
			}

			if (img.height > IMAGE_MAX_HEIGHT) {
				const error = new ErrorWithCode(
					`Height is too large. Max is ${IMAGE_MAX_WIDTH}x${IMAGE_MAX_HEIGHT} (${IMAGE_MAX_HEIGHT}). Uploaded height size: ${img.height}`
				);
				error.code = FileErrorCodes.DIMENSIONS_TOO_LARGE;
				reject(error);
				return;
			}

			resolve({
				linkType: 'external',
				file,
				name,
				src: img.src,
				hash,
				width: img.width,
				height: img.height,
			});
		};

		img.onerror = () => {
			const error = new ErrorWithCode('Image is invalid.');
			error.code = FileErrorCodes.INVALID_IMAGE;
			reject(error);
		};
	});
};
