const headers = new Headers({ 'content-type': 'application/json' });

/**
 * @param {string} id
 * @param {string} name
 */
export const changeName = async (id, name) => {
	const body = JSON.stringify({ name });

	return fetch(`/api/content?id=${id}`, { method: 'POST', body, headers });
};
