import { json } from '@sveltejs/kit';
import { readActivities } from '$lib/db/activity/read';
import { getActivityFilters } from '$lib/utils/activity';
import { replacer } from '$lib/utils/json';

export async function GET({ url }) {
	const filters = getActivityFilters(url.searchParams);

	const res = await readActivities(filters);

	const safeJSON = JSON.parse(JSON.stringify(res, replacer));

	return json(safeJSON);
}
