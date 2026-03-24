import { base64ToUint8Array } from 'uint8array-extras';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
	CLOUDFLARE_R2_ACCESS_KEY_ID,
	CLOUDFLARE_R2_BUCKET_NAME,
	CLOUDFLARE_R2_ENDPOINT,
	CLOUDFLARE_R2_SECRET_ACCESS_KEY,
} from '$env/static/private';
import { ErrorWithCode } from '$lib/errors/ErrorWithCode';
import { FileErrorCodes } from '$lib/components/editor/utils/handleNewFile';
import { getFileSizeLimit, getType } from './limits';
import { validateImageDimensions } from './validateImageDimensions.server';

const S3 = new S3Client({
	region: 'auto',
	endpoint: CLOUDFLARE_R2_ENDPOINT,
	credentials: {
		accessKeyId: CLOUDFLARE_R2_ACCESS_KEY_ID,
		secretAccessKey: CLOUDFLARE_R2_SECRET_ACCESS_KEY,
	},
});

/**
 * @param {FileUpload & { index: number, contentType: string }} userObj
 * @param {string} key
 * @param {{ id: string, userid: string }} metadata
 * @param {{ isModerator: boolean }} user
 * @throws {ErrorWithCode}
 */
export const getPresignedURL = async (
	{ contentType, contentLength, hash, fileSnippet, index },
	key,
	metadata,
	{ isModerator }
) => {
	const type = getType(contentType);

	if (!type) {
		const error = new ErrorWithCode(`Index [${index}]: Unsupported file type.`);
		error.code = FileErrorCodes.GENERIC;
		throw error;
	}

	const fileSize = getFileSizeLimit(type, contentLength, isModerator);
	if (!fileSize.allowed) {
		const error = new ErrorWithCode(
			`Index [${index}]: File size too large! Max is ${fileSize.max ? fileSize.max / 1_048_576 : '?'} MiB. Uploaded file size: ~${(contentLength / 1_048_576).toFixed(2)} MiB`
		);
		error.code = FileErrorCodes.TOO_LARGE;
		throw error;
	}

	if (type === 'image') {
		try {
			await validateImageDimensions(base64ToUint8Array(fileSnippet));
		} catch (err) {
			if (err instanceof ErrorWithCode) {
				err.message = `Index [${index}]: ${err.message}`;
			}

			throw err;
		}
	}

	const unhoistableHeaders = new Set([
		'x-amz-checksum-sha256',
		...Object.keys(metadata).map((value) => `x-amz-meta-${value}`),
	]);

	const presignedUrl = await getSignedUrl(
		S3,
		new PutObjectCommand({
			Bucket: CLOUDFLARE_R2_BUCKET_NAME,
			Key: key,
			ContentType: contentType,
			ContentLength: contentLength,
			ChecksumSHA256: Buffer.from(hash, 'hex').toString('base64'),
			Metadata: metadata,
		}),
		{ expiresIn: 3600, unhoistableHeaders } // Valid for 1 hour.
	);

	return { presignedUrl, metadata };
};
