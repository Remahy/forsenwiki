import { json } from '@sveltejs/kit';
import { readAuthorsForYPostByTitle } from '$lib/db/article/read';
import { sanitizeTitle } from '$lib/components/editor/utils/sanitizeTitle';

export async function GET({ params }) {
	const { sanitized: title } = sanitizeTitle(params.title);

	let res = await readAuthorsForYPostByTitle(title);

	if (!res) {
		throw 404;
	}

	return json(res);
}
