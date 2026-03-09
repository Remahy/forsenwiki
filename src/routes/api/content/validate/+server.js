import { error, json } from '@sveltejs/kit';
import { base64ToUint8Array } from 'uint8array-extras';
import { getFileSizeLimit, getType } from '$lib/s3/limits.js';
import { sniffMimetype } from '$lib/s3/sniffMimetype.server';
import { validateImageDimensions } from '$lib/s3/validateImageDimensions.server.js';
import { ForbiddenError } from '$lib/errors/Forbidden';
import { ErrorWithCode } from '$lib/errors/ErrorWithCode';
import prisma from '$lib/prisma';

/**
 * @param {Array<FileUpload>} files
 * @param {boolean} isModerator
 */
export const _validateContent = async (files, isModerator) => {
	if (!(files instanceof Array)) {
		return {
			status: 400,
			errors: [
				{
					index: -1,
					message:
						'Body must be an array with object: { mimetype: string, contentLength: number, hash: string, fileSnippet: string }',
				},
			],
		};
	}

	let errors = [];

	let existingFiles = [];
	for (let index = 0; index < files.length; index++) {
		const file = files[index];

		if (!file.contentLength || !file.fileSnippet || !file.mimetype || !file.hash) {
			errors.push({
				index,
				message: `Index [${index}] must be object: { mimetype: string, contentLength: number, hash: string, fileSnippet: string }`,
			});
			continue;
		}

		const res = await prisma.content.findUnique({ where: { hash: file.hash } });

		if (res) {
			existingFiles.push(true);
			continue;
		}

		existingFiles.push(null);
	}

	if (errors.length) {
		return { status: 400, errors: errors };
	}

	const nonExistingFiles =
		/** @type {Array<FileUpload & { index: number, contentType: string, type: string, mimetypeMetadata: { source: string, metadata: any }, dimensionsMetadata: import('image-size/types/interface').ISizeCalculationResult }>} */ (
			files
				.map((file, index) => {
					// @ts-ignore
					file.index = index;

					if (existingFiles[index]) {
						// @ts-ignore
						file = null;
					}

					return file;
				})
				.filter(Boolean)
		);

	// Before we generate presigned URLs in vain, let's quickly verify that they pass the validations.
	for (let index = 0; index < nonExistingFiles.length; index++) {
		const file = nonExistingFiles[index];

		if (!file.contentLength || !file.fileSnippet || !file.mimetype || !file.hash) {
			errors.push({
				index: file.index,
				message: `Index [${index}] must be object: { mimetype: string, contentLength: number, hash: string, fileSnippet: string }`,
			});
			continue;
		}

		const fileSnippet = base64ToUint8Array(file.fileSnippet);

		const contentType = await sniffMimetype(fileSnippet);

		if (!contentType) {
			errors.push({
				index: file.index,
				message: 'Could not figure out file type.',
			});
			continue;
		}

		const type = getType(contentType.mimetype);

		if (!type) {
			errors.push({
				index: file.index,
				message: 'Unsupported file type.',
			});
			continue;
		}

		const fileSize = getFileSizeLimit(type, file.contentLength, isModerator);
		if (!fileSize.allowed) {
			errors.push({
				index: file.index,
				message: `File size too large! Max is ${fileSize.max ? fileSize.max / 1_048_576 : '?'} MiB. Uploaded file size: ~${(file.contentLength / 1_048_576).toFixed(2)} MiB`,
			});
			continue;
		}

		if (type === 'image') {
			try {
				const dimensions = await validateImageDimensions(fileSnippet);

				file.dimensionsMetadata = dimensions;
			} catch (error) {
				if (error instanceof ErrorWithCode) {
					errors.push({
						index: file.index,
						message: error.message,
					});
				}
				continue;
			}
		}

		file.contentType = contentType.mimetype;
		file.type = type;
		file.mimetypeMetadata = { source: contentType.source, metadata: contentType.metadata };
	}

	if (errors.length) {
		return { status: 400, errors: errors };
	}

	return { status: 200, errors: [], files: nonExistingFiles };
};

export async function POST({ request, locals }) {
	const { isBlocked, isModerator, auth } = locals;

	if (isBlocked) {
		return ForbiddenError();
	}

	const session = await auth();
	if (!session?.user?.id || !session?.user?.name) {
		return ForbiddenError();
	}

	/**
	 * @type {Array<FileUpload>}
	 */
	const nonValidatedFiles = await request.json();

	const { status, errors, files } = await _validateContent(nonValidatedFiles, isModerator);

	if (errors.length || status !== 200 || !files?.length) {
		return error(status, JSON.stringify(errors));
	}

	return json(files.length);
}
