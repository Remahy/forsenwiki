import { createActivityParams } from '$lib/utils/activity';

/**
 * @param {{ authors: string[], types: string[], cursor: string, limit: number}} arg
 */
export const getMoreActivity = async ({ authors, types, cursor, limit }) => {
	const searchParams = createActivityParams({ authors, types, cursor, limit });

	return fetch(`/api/activity?${searchParams.toString()}`, { method: 'GET' });
};
