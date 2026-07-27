const headers = new Headers({ 'content-type': 'application/json' });

export const getUserData = async () => {
	return fetch(`/api/user`, { headers });
};

export const deleteUser = async () => {
	return fetch(`/api/user`, {
		method: 'DELETE',
	});
};
