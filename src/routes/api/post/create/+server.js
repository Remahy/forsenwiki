import { json, error, isHttpError } from '@sveltejs/kit';
import { base64ToUint8Array, uint8ArrayToBase64 } from 'uint8array-extras';

import { ForbiddenError } from '$lib/errors/Forbidden';
import { getYjsAndEditor } from '$lib/yjs/getYjsAndEditor';
import { InvalidPost } from '$lib/errors/InvalidPost';
import { getInternalIds } from '$lib/components/editor/utils/getInternalIds';
import { sanitizeTitle } from '$lib/components/editor/utils/sanitizeTitle';
import { createPost } from '$lib/db/post/create';
import { readYPostByTitle } from '$lib/db/post/read';
import { encodeYDocToUpdateV2 } from '$lib/yjs/utils';
import { upsertHTML } from '$lib/db/post/html';
import { articleConfig } from '$lib/components/editor/config/article';
import toHTML from '$lib/worker/toHTML';
import { EDITOR_IS_EDITABLE, AVAILABLE_Y_POST_TYPES, Y_POST_TYPES } from '$lib/constants/constants';
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

	const { title: rawTitle, content, type: rawType } = await request.json();

	/**
	 * @type {import('$lib/constants/constants').Y_POST_TYPES_VALUES}
	 */
	let type = AVAILABLE_Y_POST_TYPES.includes(rawType) ? rawType : Y_POST_TYPES.ARTICLE;
	const isBio = type === Y_POST_TYPES.BIO;

	let editor;
	let title;
	let doc;
	try {
		title = isBio
			? {
					raw: `User:${session.user.name}`,
					sanitized: `User:${sanitizeTitle(session.user.name).sanitized}`,
				}
			: sanitizeTitle(rawTitle);

		if (!title.sanitized) {
			// This throws, gets catched by isHttpError.
			return error(400, 'No title provided');
		}

		if (!isBio && title.raw.startsWith('User:')) {
			return error(400, 'This "User:" prefix can only be used for user bio.');
		}

		const foundTitle = await readYPostByTitle(title.sanitized);
		if (foundTitle) {
			// This throws, gets catched by isHttpError.
			return error(400, 'Post with that title already exists.');
		}

		const data = getYjsAndEditor(
			articleConfig(null, EDITOR_IS_EDITABLE, null),
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
			return InvalidPost(err);
		}

		if (isHttpError(err)) {
			throw err;
		}

		console.error(err);
		return error(400);
	}

	// By this point, we have probably modified the editor. Let's recreate the content.
	const fullYDocUpdate = encodeYDocToUpdateV2(doc);

	const { byteLength } = fullYDocUpdate;

	const contentBase64 = uint8ArrayToBase64(fullYDocUpdate);

	const internalIds = getInternalIds(editor);

	const body = { title, data: { content: contentBase64 }, ids: internalIds };
	const metadata = {
		user: { name: session.user.name, id: session.user.id },
		byteLength,
		type,
	};

	const createdPost = await createPost(body, metadata);

	const { html, text, image } = await toHTML({ config: 'article', update: contentBase64 });

	await upsertHTML(createdPost.id, { content: html, text, image });

	return json({
		...createdPost,
	});
}
