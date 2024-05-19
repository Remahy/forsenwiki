import { json, error } from '@sveltejs/kit';
import { base64ToUint8Array } from 'uint8array-extras';

import { ForbiddenError } from '$lib/errors/Forbidden';
import { articleConfig } from '$lib/components/editor/config/article';
import { updateToJSON } from '$lib/yjs/updateToJSON';
import { validateArticle } from '$lib/components/editor/validations';
import { InvalidArticle } from '$lib/errors/InvalidArticle';
import { getArticleURLIds } from '$lib/components/editor/utils/getEntities';
import { sanitizeTitle } from '$lib/components/editor/utils/sanitizeTitle';
import { createArticle } from '$lib/db/article/create';
import { readYPostByTitle } from '$lib/db/article/read';

export async function POST({ request, locals }) {
	const session = await locals.auth();
	if (!session?.user?.id || !session?.user?.name) return ForbiddenError();

	const { title: rawTitle, content } = await request.json();

	let editor;
	let title;
	try {
		editor = updateToJSON(articleConfig(null, false, null), base64ToUint8Array(content))

		await validateArticle(editor);

		title = sanitizeTitle(rawTitle);
	} catch (err) {
		if (typeof err === 'string') {
			return InvalidArticle(err);
		}

		console.error(err);
		return error(400);
	}

	if (!title) {
		return error(400, 'No title provided');
	}

	const foundTitle = await readYPostByTitle(title.sanitized);
	if (foundTitle) {
		return error(400, 'Article with that title already exists.');
	}

	const internalIds = await getArticleURLIds(editor);

	const body = { title, data: { content }, ids: internalIds };
	const user = { name: session.user.name, id: session.user.id };

	const createdArticle = await createArticle(body, user);

	return json({
		...createdArticle
	});
}
