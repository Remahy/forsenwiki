import { getContentByHash } from '$lib/api/content';
import { STATIC_DOMAIN } from '$lib/environment/environment';
import { ErrorWithCode } from '$lib/errors/ErrorWithCode';
import { getFileSizeLimit, getType } from '$lib/s3/limits';
import { calculateChecksumSha256 } from '$lib/utils/sha256';

export const FileErrorCodes = {
	NO_FILE_SIZE: 'NO_FILE_SIZE',
	TOO_LARGE: 'TOO_LARGE',
	INVALID_IMAGE: 'INVALID_IMAGE',
	DIMENSIONS_TOO_LARGE: 'DIMENSIONS_TOO_LARGE',
	GENERIC: 'GENERIC',
};

/**
 * @param {File} file
 * @param {boolean} [isModerator]
 */
export const checkFile = async (file, isModerator = false) => {
	if (!file?.size) {
		const error = new ErrorWithCode('No file size?');
		error.code = FileErrorCodes.NO_FILE_SIZE;
		throw error;
	}

	const type = getType(file.type);

	if (!type) {
		const error = new ErrorWithCode('Unsupported file type.');
		error.code = FileErrorCodes.GENERIC;
		throw error;
	}

	const name = file.name || 'Uploaded file';

	const size = file.size;

	const { allowed, max } = getFileSizeLimit(type, size, isModerator);
	if (!allowed && max) {
		const error = new ErrorWithCode(
			`File size too large! Max is ${max / 1_048_576} MiB. Uploaded file size: ~${(size / 1_048_576).toFixed(2)} MiB.`
		);
		error.code = FileErrorCodes.TOO_LARGE;
		throw error;
	}

	const hash = await calculateChecksumSha256(file);
	const res = await getContentByHash(hash);

	const fileReader = new FileReader();
	fileReader.readAsDataURL(file);

	return { file, name, hash, res, size, fileReader };
};

/**
 * @param {File} f
 * @param {boolean} [isModerator]
 * @returns {Promise<{ linkType: 'external' | 'internal', src: string, file?: File, name: string, hash: string }>}
 * @throws {ErrorWithCode}
 */
export const handleNewFile = async (f, isModerator = false) => {
	const { file, hash, name, res } = await checkFile(f, isModerator);

	if (res.status === 200) {
		const content = await res.json();
		// Take me to "Browse" and search for content.name
		return {
			linkType: 'internal',
			src: `${STATIC_DOMAIN}/${hash}`,
			name: content.name,
			hash,
		};
	}

	return {
		linkType: 'external',
		hash,
		src: hash,
		name,
		file,
	};
};
