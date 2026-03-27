import { json, error, isHttpError } from '@sveltejs/kit';
import { base64ToUint8Array, uint8ArrayToBase64 } from 'uint8array-extras';

import { ForbiddenError } from '$lib/errors/Forbidden';
import { getYjsAndEditor } from '$lib/yjs/getYjsAndEditor';
import { InvalidArticle } from '$lib/errors/InvalidArticle';
import { getInternalIds } from '$lib/components/editor/utils/getInternalIds';
import { sanitizeTitle } from '$lib/components/editor/utils/sanitizeTitle';
import { createArticle } from '$lib/db/article/create';
import { readYPostByTitle } from '$lib/db/article/read';
import { encodeYDocToUpdateV2 } from '$lib/yjs/utils';
import { upsertHTML } from '$lib/db/article/html';
import { articleConfig } from '$lib/components/editor/config/article';
import toHTML from '$lib/worker/toHTML';
import { EDITOR_IS_READONLY } from '$lib/constants/constants';
import { getUniqueImageHashes } from '$lib/components/editor/utils/getImages.js';
import { pruneFailedUploads, validateUploads } from '$lib/s3/validateUploads.server.js';
import { serverRunValidations } from '$lib/components/editor/validations/index.server.js';

export async function POST({ request, locals }) {
	const { isBlocked, auth } = locals;

	if (isBlocked) {
		return ForbiddenError();
	}

	const session = await auth();
	if (!session?.user?.id || !session?.user?.name) {
		return ForbiddenError();
	}

	const { title: rawTitle, content } = await request.json();

	let editor;
	let title;
	let doc;
	try {
		title = sanitizeTitle(rawTitle);

		if (!title.sanitized) {
			// This throws, gets catched by isHttpError.
			return error(400, 'No title provided');
		}

		const foundTitle = await readYPostByTitle(title.sanitized);
		if (foundTitle) {
			// This throws, gets catched by isHttpError.
			return error(400, 'Article with that title already exists.');
		}

		const data = getYjsAndEditor(
			articleConfig(null, EDITOR_IS_READONLY, null),
			base64ToUint8Array(content)
		);
		editor = data.editor;
		doc = data.doc;

		await serverRunValidations(editor);

		const imageHashes = getUniqueImageHashes(editor).map((hash, index) => ({ index, hash }));
		const failedUploads = await validateUploads(imageHashes);
		// Remove failed uploads from database.
		await pruneFailedUploads(
			failedUploads.map(({ hash }) => hash),
			session.user.id
		);

		if (failedUploads.length) {
			throw `FAILED_UPLOADS: ${failedUploads.map(({ index }) => `Image index [${index + 1}] doesn't exist or failed to upload.`).join(' ')}`;
		}
	} catch (err) {
		if (typeof err === 'string') {
			return InvalidArticle(err);
		}

		if (isHttpError(err)) {
			throw err;
		}

		console.error(err);
		return error(400);
	}

	// By this point, we have probably modified the editor. Let's recreate the content.
	const backendUpdate = encodeYDocToUpdateV2(doc);

	const { byteLength } = backendUpdate;

	const backendContent = uint8ArrayToBase64(backendUpdate);

	const internalIds = getInternalIds(editor);

	const body = { title, data: { content: backendContent }, ids: internalIds };
	const metadata = {
		user: { name: session.user.name, id: session.user.id },
		byteLength,
	};

	const createdArticle = await createArticle(body, metadata);

	const { html, text, image } = await toHTML({ config: 'article', update: backendContent });

	await upsertHTML(createdArticle.id, { content: html, text, image });

	return json({
		...createdArticle,
	});
}
