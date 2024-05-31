const headers = new Headers({ 'content-type': 'application/json' });

/**
 * @param {string} id
 * @param {string} name
 */
export const changeName = async (id, name) => {
	const body = JSON.stringify({ name });

	return fetch(`/api/content/${id}`, { method: 'POST', body, headers });
};

/**
 * @param {string} id
 */
export const deleteContent = async (id) => {
	return fetch(`/api/content/${id}`, { method: 'DELETE', headers });
};
