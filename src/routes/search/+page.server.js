import { _getSearch, _parseSearchParamsForSearch } from '../api/search/+server.js';

export const load = async ({ url }) => {
	const { query, types, options } = _parseSearchParamsForSearch(url);

	return _getSearch(query, types, options);
};
