/**
 * @param {string} sessionId
 */
export const deleteUser = async (sessionId) => {
	return fetch(`/api/user/${sessionId}`, {
		method: 'DELETE',
	});
};
