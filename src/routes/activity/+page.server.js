import { readActivities } from '$lib/db/activity/read';
import { getActivityFilters } from '$lib/utils/activity.js';

export async function load({ url }) {
	const filters = getActivityFilters(url.searchParams);

	const data = await readActivities(filters);

	return { activities: data };
}
