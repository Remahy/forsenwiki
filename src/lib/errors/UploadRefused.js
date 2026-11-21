/**
 * @param {string} name
 * @param {Response} res
 */
export const UploadRefusedError = (name, res) =>
	new Error(`Upload refused "${name}": ${res.status} ${res.statusText}`);
