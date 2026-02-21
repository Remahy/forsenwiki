import { error } from '@sveltejs/kit';
import { readYPostUpdatesIdsByTitle } from '$lib/db/article/read';
import { sanitizeTitle } from '$lib/components/editor/utils/sanitizeTitle.js';

export async function load({ params }) {
	const { sanitized: title } = sanitizeTitle(params.title);

	const res = await readYPostUpdatesIdsByTitle(title);

	if (!res) {
		return error(404, 'Not found');
	}

	return res;
}
