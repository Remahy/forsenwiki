import { json } from '@sveltejs/kit';
import { readActivities } from '$lib/db/activity/read';
import { getActivityFilters } from '$lib/utils/activity';
import { toSafeJSON } from '$lib/utils/json';

export async function GET({ url, locals }) {
	const { isModerator } = locals;

	const filters = getActivityFilters(url.searchParams);

	const res = await readActivities(filters, { isModerator });

	return json(toSafeJSON(res));
}
