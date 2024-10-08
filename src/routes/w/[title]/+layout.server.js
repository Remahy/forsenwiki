import { error } from '@sveltejs/kit';
import { readAuthorsForYPostByTitle } from '$lib/db/article/read';
import { _getYPostHTML } from '../../api/article/read/[title]/+server';

export async function load({ params }) {
	const { title } = params;

	try {
		const res = await _getYPostHTML(params.title);

		const authors = await readAuthorsForYPostByTitle(title);

		if (res) {
			return { ...res, authors };
		}

		return error(404, 'Not found');
	} catch (err) {
		if (typeof err === 'number') {
			return error(err);
		}

		throw err;
	}
}
