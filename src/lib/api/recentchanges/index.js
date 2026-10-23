import { createRecentChangesParams } from '#lib/utils/recentChanges.js';

/**
 * @param {{ authors: string[], cursor: string, limit: number}} arg
 */
export const getMoreRecentChanges = async ({ authors, cursor, limit }) => {
	const searchParams = createRecentChangesParams({ authors, cursor, limit });

	return fetch(`/api/recentchanges?${searchParams.toString()}`, { method: 'GET' });
};
