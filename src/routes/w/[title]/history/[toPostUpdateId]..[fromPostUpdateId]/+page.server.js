import { error } from '@sveltejs/kit';
import { sanitizeTitle } from '$lib/components/editor/utils/sanitizeTitle';
import { isSystem } from '$lib/utils/isSystem';
import { _getToYPostUpdateFromYPostUpdateByTitle } from '../../../../api/article/read/[title]/history/[toPostUpdateId]..[fromPostUpdateId]/+server';

export async function load({ params }) {
	const { title: rawTitle, toPostUpdateId, fromPostUpdateId } = params;
	const { sanitized: title } = sanitizeTitle(rawTitle);

	try {
		const res = await _getToYPostUpdateFromYPostUpdateByTitle(
			title,
			toPostUpdateId,
			fromPostUpdateId
		);

		if (isSystem({ id: res.post.title, outRelations: res.post.outRelations })) {
			return error(400, 'This is a system article. It should not have any version history.');
		}

		return res;
	} catch (err) {
		if (typeof err === 'number') {
			return error(err);
		}

		throw err;
	}
}
