import { error } from '@sveltejs/kit';
import { _getToYPostUpdateFromYPostUpdateByTitle } from '../../../../api/article/read/[title]/history/[toPostUpdateId]..[fromPostUpdateId]/+server';

export async function load({ params }) {
	const { title, toPostUpdateId, fromPostUpdateId } = params;

	try {
		const res = await _getToYPostUpdateFromYPostUpdateByTitle(
			title,
			toPostUpdateId,
			fromPostUpdateId
		);

		return res;
	} catch (err) {
		if (typeof err === 'number') {
			return error(err);
		}

		throw err;
	}
}
