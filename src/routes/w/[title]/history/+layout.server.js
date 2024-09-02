import { error } from '@sveltejs/kit';
import { readYPostUpdatesIdsByTitle } from '$lib/db/article/read';

export async function load({ params }) {
	const { title } = params;

	const res = await readYPostUpdatesIdsByTitle(title);

	if (res) {
		return res;
	}

	return error(404, 'Not found');
}
