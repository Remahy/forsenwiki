import { readActivities } from '$lib/db/activity/read';
import { getActivityFilters } from '$lib/utils/activity.js';

export async function load({ url, locals }) {
	const filters = getActivityFilters(url.searchParams);

	const data = await readActivities(filters, { isModerator: Boolean(locals.isModerator) });

	return { activities: data };
}
