const headers = new Headers({ 'content-type': 'application/json' });

/**
 * @param {string} sessionId
 */
export const getUserData = async (sessionId) => {
	return fetch(`/api/user/${sessionId}`, { headers });
};

/**
 * @param {string} sessionId
 */
export const deleteUser = async (sessionId) => {
	return fetch(`/api/user/${sessionId}`, {
		method: 'DELETE',
	});
};
