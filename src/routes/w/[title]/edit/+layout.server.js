import { error } from '@sveltejs/kit';
import { _getYPost } from '../../../api/article/read/[title]/+server';

export async function load({ params }) {
	const { title } = params;

	let res;
	try {
		res = await _getYPost(title, { html: false });
	} catch (err) {
		if (typeof err === 'number') {
			return error(err);
		}

		throw err;
	}

	if (res) {
		return { ...res };
	}

	return error(404, 'Not found');
}
