import { error } from '@sveltejs/kit';
import { sanitizeTitle } from '$lib/components/editor/utils/sanitizeTitle';
import { _getToYPostUpdateIdByTitle } from '../../../../api/article/read/[title]/history/[toPostUpdateId]/+server';
import { isSystem } from '$lib/utils/isSystem';

export async function load({ params }) {
	const { title: rawTitle, toPostUpdateId } = params;
	const { sanitized: title } = sanitizeTitle(rawTitle);

	try {
		const res = await _getToYPostUpdateIdByTitle(title, toPostUpdateId);

		if (isSystem({ id: res.title, outRelations: res.outRelations })) {
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
