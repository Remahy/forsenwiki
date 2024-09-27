import { error } from '@sveltejs/kit';
import { _getYPostUpdate } from '../../../api/article/read/[title]/+server';

export async function load({ params }) {
	const { title } = params;

	try {
		const res = await _getYPostUpdate(title);

		if (res) {
			return { ...res };
		}

		return error(404, 'Not found');
	} catch (err) {
		if (typeof err === 'number') {
			return error(err);
		}

		throw err;
	}
}
