const headers = new Headers({ 'content-type': 'application/json' });

/**
 * @param {string} query
 * @param {string[]} [types]
 * @param {{ contentTypes: string[], orderBy: string, page: number } } [options]
 */
export const searchRequest = async (query, types = [], options) => {
	const { contentTypes = [], orderBy, page = 0 } = options || {};

	const searchParams = new URLSearchParams();

	if (query) {
		searchParams.append('query', query);
	}

	for (let index = 0; index < types.length; index++) {
		const type = types[index];
		searchParams.append('type', type);
	}

	for (let index = 0; index < contentTypes.length; index++) {
		const type = contentTypes[index];
		searchParams.append('contenttype', type);
	}

	if (orderBy) {
		searchParams.append('orderby', orderBy);
	}

	if (page) {
		searchParams.append('page', String(page));
	}

	return fetch(`/api/search?${searchParams.toString()}`, {
		method: 'GET',
		headers,
	});
};
