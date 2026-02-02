import { _getSearch } from '../api/search/+server.js';

export const load = async ({ url }) => {
	const rawQuery = url.searchParams.get('query');

	if (!rawQuery) {
		return { results: [] };
	}

	const query = rawQuery.trim();

	return _getSearch(query);
};
