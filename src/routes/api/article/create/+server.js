import { json, error } from '@sveltejs/kit';
import { base64ToUint8Array } from 'uint8array-extras';

import { ForbiddenError } from '$lib/errors/Forbidden';
import { articleConfig } from '$lib/components/editor/config/article';
import { updateToJSON } from '$lib/yjs/updateToJSON';
import { validateArticle } from '$lib/components/editor/validations';
import { InvalidArticle } from '$lib/errors/InvalidArticle';
import { getArticleTitle, getArticleURLIds } from '$lib/components/editor/utils/getEntities';
import { createArticle } from '$lib/db/article/create';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
	const session = await locals.auth();
	if (!session || !session.user?.id) return ForbiddenError();

	const content = await request.text();

	let editor;
	let title;
	try {
		editor = updateToJSON(articleConfig({}, false, null), base64ToUint8Array(content))

		await validateArticle(editor);

		title = await getArticleTitle(editor);
	} catch (err) {
		if (typeof err === 'string') {
			return InvalidArticle(err);
		}

		console.error(err);
		return error(400);
	}

	const internalIds = await getArticleURLIds(editor)

	const createdArticle = await createArticle({ userId: session.user.id, data: { title, content }, ids: internalIds });

	return json({
		...createdArticle
	});
}
