/**
 * @param {URL} url
 */
export const parseSearchURL = (url) => {
	const query = url.searchParams.get('query') || '';
	const types = url.searchParams.getAll('type') || [];
	const orderBy = url.searchParams.get('order') || 'desc';

	/** @type {string[]} */
	let contentTypes = [];
	if (types.includes('content') || types.includes('') || !types.length) {
		const ct = url.searchParams.getAll('contenttype') || [];
		contentTypes = ct;
	}

	return { query, types, options: { contentTypes, orderBy } };
};
