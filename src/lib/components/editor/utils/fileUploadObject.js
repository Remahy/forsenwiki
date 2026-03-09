import { uint8ArrayToBase64 } from 'uint8array-extras';

/**
 * @param {File} file
 * @param {string} name
 * @param {string} hash
 * @returns {Promise<FileUpload & { file: File }>}
 */
export const createFileUploadObject = async (file, name, hash) => {
	// We just need 16kb to validate image.
	const fileSnippet =
		file.size > 16_384 ? await file.slice(0, 16_384).arrayBuffer() : await file.arrayBuffer();

	return {
		file,
		contentLength: file.size,
		hash,
		mimetype: file.type,
		fileSnippet: uint8ArrayToBase64(new Uint8Array(fileSnippet)),
		name,
	};
};
