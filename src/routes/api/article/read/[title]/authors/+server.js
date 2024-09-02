import { json } from '@sveltejs/kit';
import { readAuthorsForYPostByTitle } from '$lib/db/article/read';

export async function GET({ params }) {
	let res = await readAuthorsForYPostByTitle(params.title);

	if (!res) {
		throw 404;
	}

	return json(res);
}
