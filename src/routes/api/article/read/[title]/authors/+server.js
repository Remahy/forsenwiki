import { error, json } from '@sveltejs/kit';
import { readAuthorsForYPostByTitle, readYPostByTitle } from '$lib/db/article/read';
import { sanitizeTitle } from '$lib/components/editor/utils/sanitizeTitle';

export async function GET({ params }) {
	const { sanitized: title } = sanitizeTitle(params.title);

	const article = await readYPostByTitle(title);

	if (!article) {
		return error(404);
	}

	const res = await readAuthorsForYPostByTitle(article.title);

	return json(res);
}
