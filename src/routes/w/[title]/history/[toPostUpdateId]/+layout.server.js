import { error } from '@sveltejs/kit';
import { _getToYPostUpdateIdByTitle } from '../../../../api/article/read/[title]/history/[toPostUpdateId]/+server';

export async function load({ params }) {
	const { title, toPostUpdateId } = params;

	try {
		const res = await _getToYPostUpdateIdByTitle(title, toPostUpdateId);

		return res;
	} catch (err) {
		if (typeof err === 'number') {
			return error(err);
		}

		throw err;
	}
}
