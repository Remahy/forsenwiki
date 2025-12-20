import { redirect, error } from '@sveltejs/kit';
import { _getYPostUpdateIds } from '../../../../api/article/read/[title]/history/[toPostUpdateId]..[fromPostUpdateId]/+server';

export async function load({ params }) {
	const { title, toPostUpdateId } = params;

	try {
		const res = await _getYPostUpdateIds(title, toPostUpdateId, null);

		if (!res.fromPostUpdateId) {
			return redirect(307, `/w/${title}/history/${toPostUpdateId}`);
		}

		return redirect(307, `/w/${title}/history/${res.fromPostUpdateId}..${toPostUpdateId}`);
	} catch (err) {
		if (typeof err === 'number') {
			return error(err);
		}

		throw err;
	}
}
