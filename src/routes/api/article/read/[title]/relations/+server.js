import { error, json } from '@sveltejs/kit';
import { readRelationsToYPostTitle, readYPostByTitle } from '$lib/db/article/read';
import { sanitizeTitle } from '$lib/components/editor/utils/sanitizeTitle';

export async function GET({ params }) {
	const { sanitized: title } = sanitizeTitle(params.title);

	const article = await readYPostByTitle(title);

	if (!article) {
		return error(404);
	}

	const relatedPosts = await readRelationsToYPostTitle(title);

	return json(relatedPosts);
}
