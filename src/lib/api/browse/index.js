const headers = new Headers({ 'content-type': 'application/json' });

/**
 * @param {string} cursor YPost id
 */
export const browseRequest = async (cursor) => {
	return fetch(`/api/browse?cursor=${cursor}`, { method: 'GET', headers });
};
