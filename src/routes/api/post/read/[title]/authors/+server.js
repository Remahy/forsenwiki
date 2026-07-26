import { error, json } from '@sveltejs/kit';
import { readAuthorsForYPostByTitle, readYPostByTitle } from '$lib/db/post/read';
import { sanitizeTitle } from '$lib/components/editor/utils/sanitizeTitle';

export async function GET({ params }) {
	const { sanitized: title } = sanitizeTitle(params.title);

	const post = await readYPostByTitle(title);

	if (!post) {
		return error(404);
	}

	const res = await readAuthorsForYPostByTitle(post.title);

	return json(res);
}
