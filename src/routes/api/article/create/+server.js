import { json, error } from '@sveltejs/kit';
import { base64ToUint8Array } from 'uint8array-extras';

import { ForbiddenError } from '$lib/errors/Forbidden';
import { articleConfig } from '$lib/components/editor/config/article';
import { getYjsAndEditor } from '$lib/yjs/getYjsAndEditor';
import { validateArticle } from '$lib/components/editor/validations';
import { InvalidArticle } from '$lib/errors/InvalidArticle';
import { getArticleURLIds } from '$lib/components/editor/utils/getEntities';
import { sanitizeTitle } from '$lib/components/editor/utils/sanitizeTitle';
import { createArticle } from '$lib/db/article/create';
import { readYPostByTitle } from '$lib/db/article/read';
import { encodeYDocToUpdateV2ToBase64 } from '$lib/yjs/utils';
import { adjustAndUploadImages } from '$lib/components/editor/validations/images.server';
import { upsertHTML } from '$lib/db/article/html';
import { toHTML } from '$lib/lexicalHTML.server';

export async function POST({ request, locals }) {
	if (locals.isBlocked) return ForbiddenError();

	const session = await locals.auth();
	if (!session?.user?.id || !session?.user?.name) return ForbiddenError();

	const { title: rawTitle, content } = await request.json();

	let e;
	let title;
	try {
		e = getYjsAndEditor(articleConfig(null, false, null), base64ToUint8Array(content));
		const { editor } = e;

		// Does not modify the editor.
		await validateArticle(editor);

		title = sanitizeTitle(rawTitle);

		// Modifies the editor.
		await adjustAndUploadImages(editor, title.sanitized, { id: session.user.id });
	} catch (err) {
		if (typeof err === 'string') {
			return InvalidArticle(err);
		}

		console.error(err);
		return error(400);
	}
	const { editor, doc } = e;

	// By this point, we have probably modified the editor. Let's recreate the content.
	const backendContent = encodeYDocToUpdateV2ToBase64(doc);

	if (!title) {
		return error(400, 'No title provided');
	}

	const foundTitle = await readYPostByTitle(title.sanitized);
	if (foundTitle) {
		return error(400, 'Article with that title already exists.');
	}

	const internalIds = await getArticleURLIds(editor);

	const body = { title, data: { content: backendContent }, ids: internalIds };
	const user = { name: session.user.name, id: session.user.id };

	const createdArticle = await createArticle(body, user);

	await upsertHTML(createdArticle.id, await toHTML(editor));

	return json({
		...createdArticle,
	});
}
