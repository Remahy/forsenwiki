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

/**
 * @param {string} hash
 */
export const getContentByHash = async (hash) => {
	return fetch(`/api/content/validate/${hash}`, { method: 'GET', headers });
};

/**
 * @param {Array<FileUpload>} files
 */
export const validateContent = async (files) => {
	const body = JSON.stringify(files);

	return fetch(`/api/content/validate`, { method: 'POST', body, headers });
};

/**
 * @param {Array<FileUpload>} files
 */
export const uploadContent = async (files) => {
	const body = JSON.stringify(files.map((e) => ({ ...e, file: undefined })));

	return fetch(`/api/content`, { method: 'POST', body, headers });
};
