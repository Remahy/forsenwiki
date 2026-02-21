import { error, json } from '@sveltejs/kit';
import { readYPostUpdatesIdsByTitle } from '$lib/db/article/read';
import { replacer } from '$lib/utils/json';
import { sanitizeTitle } from '$lib/components/editor/utils/sanitizeTitle';

export async function GET({ params }) {
	const { sanitized: title } = sanitizeTitle(params.title);

	const res = await readYPostUpdatesIdsByTitle(title);

	if (!res) {
		return error(404);
	}

	const safeJSON = JSON.parse(JSON.stringify(res, replacer));

	return json(safeJSON);
}
