import { error } from '@sveltejs/kit';
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

	/**
	 * @type {Array<{ name: string }>}
	 */
	const authors = [];

	if (res) {
		return { ...res, authors };
	}

	return error(404, 'Not found');
}
