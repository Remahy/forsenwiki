const headers = new Headers({ 'content-type': 'application/json' });

/**
 * @param {string} query
 * @param {string} [type]
 */
export const searchRequest = async (query, type = '') => {
	return fetch(`/api/search?query=${encodeURIComponent(query)}&type=${type}`, { method: 'GET', headers });
};
