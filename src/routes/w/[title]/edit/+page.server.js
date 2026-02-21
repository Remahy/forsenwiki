import { error } from '@sveltejs/kit';
import { sanitizeTitle } from '$lib/components/editor/utils/sanitizeTitle';
import { _getYPostUpdate } from '../../../api/article/read/[title]/+server';
import { isSystem } from '$lib/utils/isSystem';

export async function load({ params }) {
	const { sanitized: title } = sanitizeTitle(params.title);

	try {
		const res = await _getYPostUpdate(title);

		if (!res) {
			return error(404, 'Not found');
		}

		if (isSystem(res.post)) {
			return error(400, 'This is a system article that cannot be edited.');
		}

		return { ...res };
	} catch (err) {
		if (typeof err === 'number') {
			return error(err);
		}

		throw err;
	}
}
