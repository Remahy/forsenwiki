import { STATIC_DOMAIN } from '$lib/environment/environment';
import { loadContent } from '$lib/utils/indexedDb/content';
import { uploadContent } from '$lib/api/content';
import { createFileUploadObject } from '$lib/components/editor/utils/fileUploadObject';
import {
	addNewUploaded,
	setUploading,
} from '$lib/components/uploadingContentModalGlobals.svelte.js';
import { getUniqueImageHashes } from '$lib/components/editor/utils/getImages';

/**
 * https://stackoverflow.com/a/41797377
 * @param {string} hexstring
 */
function hexToBase64(hexstring) {
	return btoa(
		// @ts-ignore
		hexstring
			.match(/\w{2}/g)
			.map(function (a) {
				return String.fromCharCode(parseInt(a, 16));
			})
			.join('')
	);
}

/**
 * @param {string} contentType
 * @param {string} hash
 * @param {{ [x: string]: string }} metadata
 */
const headers = (contentType, hash, metadata) => {
	const headers = new Headers({
		'content-type': contentType,
		'x-amz-checksum-sha256': hexToBase64(hash),
	});

	const metadataArr = Object.entries(metadata);

	for (let index = 0; index < metadataArr.length; index++) {
		const [key, value] = metadataArr[index];

		headers.set(`x-amz-meta-${key}`, value);
	}

	return headers;
};

/**
 * @param {LexicalEditor} editor
 * @param {string} id
 */
const getImages = async (editor, id) => {
	const imageSrcArr = getUniqueImageHashes(editor);

	/**
	 * @type {Array<ReturnType<createFileUploadObject>>}
	 */
	const foundImages = [];

	for (let index = 0; index < imageSrcArr.length; index++) {
		const src = imageSrcArr[index];

		// Find in indexedDB
		const content = await loadContent(id, src);

		if (!content) {
			// Probably uploaded.
			continue;
		}

		const { file, hash } = content;

		foundImages.push(createFileUploadObject(file, file.name, hash));
	}

	return Promise.all(foundImages);
};

/**
 * @param {Array<FileUpload & { file: File }>} contentToUpload
 * @returns
 */
const uploadContentHandler = async (contentToUpload) => {
	const presignRes = await uploadContent(contentToUpload);

	if (presignRes.status !== 200) {
		const errorJSON = await presignRes.json();

		let error;
		try {
			if (errorJSON.message === 'Internal Error') {
				throw new Error(errorJSON.message);
			}

			const parsedMessage = JSON.parse(errorJSON.message);

			/**
			 * @type {Array<{ index: number, message: string }>}
			 */
			const errors = parsedMessage;

			if (errors[0].index === -1) {
				// -1 index means global error.
				error = errors[0].message;
			} else {
				error = errors.map(({ message }) => message).join('\n');
			}
		} catch (err) {
			// @ts-ignore
			error = `${presignRes.status}: ${err?.message || presignRes.statusText}`;
			console.error(err);
		}

		throw new Error(error);
	}

	/**
	 * @type {Array<{ index: number, url: string, contentType: string, metadata: { id: string } }>}
	 */
	const presignedURLs = await presignRes.json();

	const uploads = [];
	for (let index = 0; index < presignedURLs.length; index++) {
		const presignEntry = presignedURLs[index];

		const { file, hash } = contentToUpload[presignEntry.index];

		uploads.push(
			fetch(presignEntry.url, {
				method: 'PUT',
				headers: headers(presignEntry.contentType, hash, presignEntry.metadata),
				body: file,
			}).then(() =>
				addNewUploaded({
					id: presignEntry.metadata.id,
					url: `${STATIC_DOMAIN}/${hash}`,
					contentType: presignEntry.contentType,
				})
			)
		);
	}

	let uploadsRes;
	try {
		uploadsRes = await Promise.all(uploads);
	} catch (err) {
		console.error(err);
		throw new Error('Error uploading new file contents.', { cause: err });
	}

	return uploadsRes;
};

/**
 * @param {LexicalEditor} editor
 * @param {string} id
 */
export const uploadImages = async (editor, id) => {
	const imagesToUpload = await getImages(editor, id);

	setUploading(imagesToUpload.length);

	return uploadContentHandler(imagesToUpload);
};

/**
 * @param {(FileUpload & { file: File; })[]} files
 */
export const uploadFiles = async (files) => {
	setUploading(files.length);

	return uploadContentHandler(files);
};
