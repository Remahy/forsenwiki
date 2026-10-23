import { error, json } from '@sveltejs/kit';
import { readYPostUpdatesIdsByTitle } from '#lib/db/post/read.js';
import { replacer } from '#lib/utils/json.js';
import { sanitizeTitle } from '#lib/components/editor/utils/sanitizeTitle.js';

export async function GET({ params }) {
	const { sanitized: title } = sanitizeTitle(params.title);

	const res = await readYPostUpdatesIdsByTitle(title);

	if (!res) {
		return error(404);
	}

	const safeJSON = JSON.parse(JSON.stringify(res, replacer));

	return json(safeJSON);
}
