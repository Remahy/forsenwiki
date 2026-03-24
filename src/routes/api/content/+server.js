import { error, json } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import { ForbiddenError } from '$lib/errors/Forbidden.js';
import { _validateContent } from './validate/+server';
import { getPresignedURL } from '$lib/s3/index.server';
import { createContent } from '$lib/db/content/create';
import { ErrorWithCode } from '$lib/errors/ErrorWithCode';
import { CLOUDFLARE_R2_SECRET_ACCESS_KEY } from '$env/static/private';

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

	if (errors?.length || status !== 200) {
		return error(status, JSON.stringify(errors));
	}

	if (!files?.length) {
		return json([]);
	}

	/**
	 * @type {Array<{ url: string, index: number, contentType: string, metadata: any }>}
	 */
	let presignedUrls = [];

	for (let index = 0; index < files.length; index++) {
		const file = files[index];

		/**
		 * @type {{ userid: string, name: string, mimetype: string, dimensions?: string }}
		 */
		const metadata = {
			userid: session.user.id,
			name: file.name,
			mimetype: JSON.stringify(file.mimetypeMetadata),
		};

		if (file.dimensionsMetadata) {
			metadata.dimensions = JSON.stringify(file.dimensionsMetadata);
		}

		try {
			await prisma.$transaction(async (tx) => {
				const content = await createContent({ ...file, authorId: metadata.userid, metadata }, tx);

				if (!CLOUDFLARE_R2_SECRET_ACCESS_KEY) {
					// TODO: If no S3, then upload locally.
					return true;
				}

				const { presignedUrl, metadata: finalMetadata } = await getPresignedURL(
					file,
					file.hash,
					{ ...metadata, id: content.id },
					{ isModerator }
				);

				presignedUrls.push({
					index: /** @type {number} */ (file.index),
					url: presignedUrl,
					contentType: file.contentType,
					metadata: finalMetadata,
				});
			});
		} catch (err) {
			if (err instanceof ErrorWithCode) {
				return error(500, err.message);
			}
		}
	}

	return json(presignedUrls);
}
