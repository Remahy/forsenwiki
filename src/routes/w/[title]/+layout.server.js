import { error } from '@sveltejs/kit';
import { readAuthorsForYPostByTitle } from '$lib/db/article/read';
import { _getYPostAndHtml } from '../../api/article/read/[title]/+server';

export async function load({ params }) {
	const { title } = params;

	let res;
	try {
		res = await _getYPostAndHtml(title);
	} catch (err) {
		if (typeof err === 'number') {
			return error(err);
		}

		throw err;
	}

	const authors = await readAuthorsForYPostByTitle(title);

	if (res) {
		return { ...res, authors };
	}

	return error(404, 'Not found');
}
