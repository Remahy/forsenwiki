import { getContentByHash } from '$lib/api/content';
import { IMAGE_MAX_HEIGHT, IMAGE_MAX_WIDTH } from '$lib/constants/image';
import { ErrorWithCode } from '$lib/errors/ErrorWithCode';
import { IMAGE_AUDIO_FILE_SIZE } from '$lib/s3/limits';
import { calculateChecksumSha256 } from '$lib/utils/sha256';

export const ImageErrorCodes = {
	NO_FILE_SIZE: 'NO_FILE_SIZE',
	TOO_LARGE: 'TOO_LARGE',
	INVALID_IMAGE: 'INVALID_IMAGE',
	DIMENSIONS_TOO_LARGE: 'DIMENSIONS_TOO_LARGE',
	GENERIC: 'GENERIC',
};

/**
 * @param {File} file
 * @returns {Promise<{ linkType: 'external' | 'internal', src: string, file?: File, name: string, width: number, height: number, hash: string }>}
 * @throws {ErrorWithCode}
 */
export const handleNewImage = async (file) => {
	if (!file?.size) {
		const error = new ErrorWithCode('No file size?');
		error.code = ImageErrorCodes.NO_FILE_SIZE;
		throw error;
	}

	// @ts-ignore
	const name = file.name || 'Uploaded image';

	const size = file.size;

	if (size > IMAGE_AUDIO_FILE_SIZE) {
		const error = new ErrorWithCode(
			`File size too large! Max is ${IMAGE_AUDIO_FILE_SIZE / 1_048_576} MiB. Uploaded file size: ~${(size / 1_048_576).toFixed(2)} MiB`
		);
		error.code = ImageErrorCodes.TOO_LARGE;
		throw error;
	}

	const hash = await calculateChecksumSha256(file);
	const res = await getContentByHash(hash);

	const fileReader = new FileReader();
	fileReader.readAsDataURL(file);
	const img = new Image();

	return new Promise((resolve, reject) => {
		fileReader.addEventListener('load', () => {
			if (typeof fileReader.result === 'string') {
				img.src = fileReader.result;
			}
		});

		img.onload = async () => {
			if (res.status === 200) {
				// TODO: Already exists.
				const content = await res.json();
				// Take me to "Browse" and search for content.name
				resolve({
					linkType: 'internal',
					src: '', // TODO
					name,
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
				error.code = ImageErrorCodes.DIMENSIONS_TOO_LARGE;
				reject(error);
				return;
			}

			if (img.height > IMAGE_MAX_HEIGHT) {
				const error = new ErrorWithCode(
					`Height is too large. Max is ${IMAGE_MAX_WIDTH}x${IMAGE_MAX_HEIGHT} (${IMAGE_MAX_HEIGHT}). Uploaded height size: ${img.height}`
				);
				error.code = ImageErrorCodes.DIMENSIONS_TOO_LARGE;
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
			const error = new ErrorWithCode('Image is invalid');
			error.code = ImageErrorCodes.INVALID_IMAGE;
			reject(error);
		};

		fileReader.addEventListener('error', () => {
			const error = new ErrorWithCode(fileReader.error?.message);
			error.code = ImageErrorCodes.GENERIC;
			reject(error);
		});
	});
};
