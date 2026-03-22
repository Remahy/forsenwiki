/**
 * @param {URL} url
 */
export const parseSearchURL = (url) => {
	const query = url.searchParams.get('query') || '';
	const types = url.searchParams.getAll('type') || [];
	const orderBy = url.searchParams.get('order') || 'desc';
	const p = url.searchParams.get('page') || '0';
	const page = Number.isNaN(parseInt(p)) ? 0 : parseInt(p);

	/** @type {string[]} */
	let contentTypes = [];
	if (types.includes('content') || types.includes('')) {
		const ct = url.searchParams.getAll('contenttype') || [];
		contentTypes = ct;
	}

	return { query, types, options: { contentTypes, orderBy, page } };
};
