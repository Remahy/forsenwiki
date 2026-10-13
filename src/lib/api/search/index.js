const headers = new Headers({ 'content-type': 'application/json' });

/** @typedef {{ title: string, rawTitle: string, fileType?: import('$lib/s3/limits').MimetypeType, contentType?: string | null, createdTimestamp: string, id: string }} SearchResult */

/**
 * @param {string} query
 * @param {string[]} [types]
 * @param {{ contentTypes?: string[], orderBy?: string, page?: number, signal?: AbortSignal } } [options]
 */
export const searchRequest = async (query, types = [], options) => {
	const { contentTypes = [], orderBy, page = 0, signal = null } = options || {};

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
		signal,
		method: 'GET',
		headers,
	});
};
