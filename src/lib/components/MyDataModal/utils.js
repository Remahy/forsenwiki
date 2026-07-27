import { Zip, ZipDeflate } from 'fflate';
import { STATIC_DOMAIN } from '$lib/environment/environment';

/**
 * @type {File[]}
 */
let failedToReadContentLength = [];

/**
 * @type {File[]}
 */
let failedToCompress = [];

const MAX_ZIP_SIZE = 400 * 1024 * 1024; // 400 MB

/**
 * @typedef {import('../../../routes/api/user/+server').Uploads} Uploads
 */

/**
 * @param {any} file
 */
const getFileContentLength = async (file) => {
	const response = await fetch(file.url, {
		method: 'HEAD',
	});

	if (!response.ok) {
		failedToReadContentLength.push(file);
		console.error(`Failed to get size for ${file.url}`);
		return -1n;
	}

	const contentLength = response.headers.get('content-length');

	if (!contentLength) {
		failedToReadContentLength.push(file);
		console.error(`Missing Content-Length for ${file.url}`);
		return -1n;
	}

	return BigInt(contentLength);
};

/**
 * @param {Uploads} files
 */
const getFiles = async (files) => {
	const f = await Promise.all(
		files
			.map((file) => ({
				...file,
				url: `${STATIC_DOMAIN}/${file.hash}`,
			}))
			.map(async (file) => ({
				...file,
				contentLength: file.contentLength || (await getFileContentLength(file)),
			}))
	);

	return f.filter(({ contentLength }) => contentLength !== -1n);
};

/**
 * @typedef {Awaited<ReturnType<getFiles>>['0']} File
 */

/**
 * @param {Array<File>} files
 */
const chunkFiles = (files) => {
	const chunks = [];

	let currentChunk = [];
	let currentContentLength = 0n;

	for (const file of files) {
		if (currentContentLength + file.contentLength > BigInt(MAX_ZIP_SIZE)) {
			chunks.push(currentChunk);

			currentChunk = [];
			currentContentLength = 0n;
		}

		currentChunk.push(file);
		currentContentLength += file.contentLength;
	}

	if (currentChunk.length > 0) {
		chunks.push(currentChunk);
	}

	return chunks;
};

/**
 * @param {Uploads} files
 */
export const prepareFiles = async (files) => {
	failedToReadContentLength = [];

	const filesWithProps = await getFiles(files);

	const sortedFiles = [...filesWithProps].sort((a, b) => Number(b.contentLength - a.contentLength));

	return { chunks: chunkFiles(sortedFiles), failed: failedToReadContentLength };
};

/**
 * @param {Array<File>} files
 * @param {Zip} zip
 */
const addFilesToZip = async (files, zip) => {
	for (const file of files) {
		const entry = new ZipDeflate(file.name);

		try {
			const response = await fetch(file.url);
			if (!response.ok) {
				throw new Error(`Failed to fetch ${file.name}`);
			}

			const data = new Uint8Array(await response.arrayBuffer());

			zip.add(entry);

			entry.push(data, true);
		} catch (err) {
			console.error('Failed to upload file to zip:', file.url, 'reason:', err);
			failedToCompress.push(file);
		}
	}

	zip.end();
};

/**
 * @param {Array<File>} files
 * @returns {Promise<{ blob: Blob, failed: File[] }>}
 */
export const createZip = async (files) => {
	failedToCompress = [];

	return new Promise((resolve, reject) => {
		/**
		 * @type {Uint8Array[]}
		 */
		const chunks = [];

		const zip = new Zip((err, data, final) => {
			if (err) {
				reject(err);
				return;
			}

			chunks.push(data);

			if (final) {
				resolve({
					blob: new Blob(
						chunks.map((chunk) => new Uint8Array(chunk)),
						{
							type: 'application/zip',
						}
					),
					failed: failedToCompress,
				});
			}
		});

		addFilesToZip(files, zip).catch(reject);
	});
};
