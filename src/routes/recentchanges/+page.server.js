import { getRecentChangesFilters } from '$lib/utils/recentChanges.js';
import { _getRecentChanges } from '../api/recentchanges/+server.js';

export async function load({ url }) {
	const filters = getRecentChangesFilters(url.searchParams);

	const data = await _getRecentChanges(filters);

	return { latestUpdates: data };
}
