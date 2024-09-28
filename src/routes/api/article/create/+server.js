import { json, error } from '@sveltejs/kit';
import { base64ToUint8Array, uint8ArrayToBase64 } from 'uint8array-extras';

import { ForbiddenError } from '$lib/errors/Forbidden';
import { getYjsAndEditor } from '$lib/yjs/getYjsAndEditor';
import { validateArticle } from '$lib/components/editor/validations';
import { InvalidArticle } from '$lib/errors/InvalidArticle';
import { getArticleURLIds } from '$lib/components/editor/utils/getEntities';
import { sanitizeTitle } from '$lib/components/editor/utils/sanitizeTitle';
import { createArticle } from '$lib/db/article/create';
import { readYPostByTitle } from '$lib/db/article/read';
import { encodeYDocToUpdateV2 } from '$lib/yjs/utils';
import { adjustAndUploadImages } from '$lib/components/editor/validations/images.server';
import { upsertHTML } from '$lib/db/article/html';
import { toHTML } from '$lib/lexical/toHTML.server';
import { adjustVideoEmbedNodeSiblings } from '$lib/components/editor/validations/videos.server';

export async function POST({ request, locals }) {
	if (locals.isBlocked) {
		return ForbiddenError();
	}

	const session = await locals.auth();
	if (!session?.user?.id || !session?.user?.name) {
		return ForbiddenError();
	}

	const { title: rawTitle, content } = await request.json();

	const { articleConfig } = await import('$lib/components/editor/config/article');

	let editor;
	let title;
	let doc;
	try {
		const yjs = getYjsAndEditor(articleConfig(null, false, null), base64ToUint8Array(content));
		editor = yjs.editor;
		doc = yjs.doc;

		// Does not modify the editor.
		await validateArticle(editor);

		title = sanitizeTitle(rawTitle);

		// Modifies the editor.
		await adjustAndUploadImages(editor, title.sanitized, { id: session.user.id });
		await adjustVideoEmbedNodeSiblings(editor);
	} catch (err) {
		if (typeof err === 'string') {
			return InvalidArticle(err);
		}

		console.error(err);
		return error(400);
	}

	// By this point, we have probably modified the editor. Let's recreate the content.
	const backendUpdate = encodeYDocToUpdateV2(doc);

	const { byteLength } = backendUpdate;

	const backendContent = uint8ArrayToBase64(backendUpdate);

	if (!title) {
		return error(400, 'No title provided');
	}

	const foundTitle = await readYPostByTitle(title.sanitized);
	if (foundTitle) {
		return error(400, 'Article with that title already exists.');
	}

	const internalIds = await getArticleURLIds(editor);

	const body = { title, data: { content: backendContent }, ids: internalIds };
	const metadata = { user: { name: session.user.name, id: session.user.id }, byteLength };

	const createdArticle = await createArticle(body, metadata);

	await upsertHTML(createdArticle.id, await toHTML(editor));

	return json({
		...createdArticle,
	});
}
