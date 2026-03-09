import { imageSize } from 'image-size';
import { ErrorWithCode } from '$lib/errors/ErrorWithCode';
import { ImageErrorCodes } from '$lib/components/editor/utils/handleNewImage';
import { IMAGE_MAX_HEIGHT, IMAGE_MAX_WIDTH } from '$lib/constants/image';

/**
 * @param {Uint8Array} fileSnippet first 16KB of file
 * @throws {ErrorWithCode}
 */
export const validateImageDimensions = async (fileSnippet) => {
	const dimensions = imageSize(fileSnippet);

	if (!dimensions.width || !dimensions.height) {
		const error = new ErrorWithCode("Couldn't validate image dimensions.");
		error.code = ImageErrorCodes.GENERIC;
		throw error;
	}

	if (dimensions.height > IMAGE_MAX_HEIGHT) {
		const error = new ErrorWithCode(
			`Height is too large. Max is ${IMAGE_MAX_WIDTH}x${IMAGE_MAX_HEIGHT} (${IMAGE_MAX_HEIGHT}). Uploaded height size: ${dimensions.height}`
		);
		error.code = ImageErrorCodes.DIMENSIONS_TOO_LARGE;
		throw error;
	}

	if (dimensions.width > IMAGE_MAX_WIDTH) {
		const error = new ErrorWithCode(
			`Width is too large. Max is ${IMAGE_MAX_WIDTH}x${IMAGE_MAX_HEIGHT} (${IMAGE_MAX_WIDTH}). Uploaded width size: ${dimensions.width}`
		);
		error.code = ImageErrorCodes.DIMENSIONS_TOO_LARGE;
		throw error;
	}

	return dimensions;
};
