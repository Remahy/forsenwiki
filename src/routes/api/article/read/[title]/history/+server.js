import { json } from '@sveltejs/kit';
import { readYPostUpdatesIdsByTitle } from '$lib/db/article/read';

export async function GET({ params }) {
	let res = await readYPostUpdatesIdsByTitle(params.title);
	
	if (!res) {
		throw 404;
	}

	return json(res);
}
