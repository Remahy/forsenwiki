import { redirect, error } from '@sveltejs/kit';
import { _getToYPostUpdateFromYPostUpdateByTitle } from '../../../../api/article/read/[title]/history/[toPostUpdateId]..[fromPostUpdateId]/+server';

export async function GET({ params }) {
	const { title, toPostUpdateId } = params;

	try {
		const res = await _getToYPostUpdateFromYPostUpdateByTitle(title, toPostUpdateId, null, true);

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
