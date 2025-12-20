import { json } from '@sveltejs/kit';
import { readYPostUpdatesIdsByTitle } from '$lib/db/article/read';
import { replacer } from '$lib/utils/json';

export async function GET({ params }) {
	let res = await readYPostUpdatesIdsByTitle(params.title);

	if (!res) {
		throw 404;
	}

	const safeJSON = JSON.parse(JSON.stringify(res, replacer));

	return json(safeJSON);
}
