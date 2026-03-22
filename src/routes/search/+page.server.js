import { _getSearch } from '../api/search/+server.js';

export const load = async ({ url }) => {
	const rawQuery = url.searchParams.get('query') || '';
	const rawType = url.searchParams.getAll('type') || [];
	const rawContentType = url.searchParams.getAll('contenttype') || [];
	const rawOrderBy = url.searchParams.get('order') || 'desc';

	const query = rawQuery.trim();
	const type = rawType.map((t) => t.trim()).filter(Boolean);
	const contentType = rawContentType.map((t) => t.trim()).filter(Boolean);

	/** @type {'asc' | 'desc'} */
	const orderBy = /** @type {any} */ (
		['asc', 'desc'].includes(rawOrderBy.toLowerCase()) ? rawOrderBy.toLowerCase() : 'desc'
	);

	return _getSearch(query, type, { contentType, orderBy });
};
