const headers = new Headers({ 'content-type': 'application/json' });

/**
 * @param {{ streamerMode?: boolean }} arg
 */
export const saveUserSettings = async ({ streamerMode }) => {

	const body = JSON.stringify({ streamerMode });

	return fetch(`/api/user/settings`, { method: 'POST', body, headers });
};
