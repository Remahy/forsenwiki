export const MINIMUM_LIMIT = 15;
export const MAXIMUM_LIMIT = 100;

/**
 * @param {URLSearchParams} searchParams
 */
export const getRecentChangesFilters = (searchParams) => {
	const cursor = searchParams.get('cursor');
	const authors = searchParams.getAll('author');
	const rawLimit = searchParams.get('limit');

	const limit = Math.min(
		Math.max(
			Number.isNaN(Number(rawLimit)) ? MINIMUM_LIMIT : Number(searchParams.get('limit')),
			MINIMUM_LIMIT
		),
		MAXIMUM_LIMIT
	);

	return {
		cursor,
		authors,
		limit,
	};
};

/**
 * @param {{ authors?: string[], cursor?: string, limit?: number}} arg
 */
export const createRecentChangesParams = ({ authors, cursor, limit }) => {
	const searchParams = new URLSearchParams();

	if (authors) {
		authors.forEach((author) => searchParams.append('author', author));
	}

	if (cursor) {
		searchParams.append('cursor', cursor);
	}

	if (limit) {
		searchParams.append('limit', Number(limit).toString());
	}

	return searchParams;
};

/**
 * @param {string} authors
 */
export const handleAuthorsString = (authors) => {
	return authors
		.split(',')
		.map((author) => author.trim())
		.filter(Boolean);
};
