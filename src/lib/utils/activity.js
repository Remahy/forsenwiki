import { AVAILABLE_ACTIVITY_TYPES } from '$lib/constants/activity';

export const MINIMUM_LIMIT = 15;
export const MAXIMUM_LIMIT = 100;

/**
 * @param {URLSearchParams} searchParams
 */
export const getActivityFilters = (searchParams) => {
	const cursor = searchParams.get('cursor');
	const authors = searchParams.getAll('author');
	const requestedTypes = searchParams.getAll('type');
	const types = AVAILABLE_ACTIVITY_TYPES.filter((type) => requestedTypes.includes(type));
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
		types,
		limit,
	};
};

/**
 * @param {{ authors?: string[], types?: string[], cursor?: string, limit?: number}} arg
 */
export const createActivityParams = ({ authors, types, cursor, limit }) => {
	const searchParams = new URLSearchParams();

	if (authors) {
		authors.forEach((author) => searchParams.append('author', author));
	}

	if (types) {
		types.forEach((type) => searchParams.append('type', type));
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

/**
 * @param {import('$lib/db/activity/read').ActivityEntry} activity
 * @param {{ authors: string[], types: string[] }} filters
 */
export const activityMatchesFilters = (activity, { authors, types }) => {
	const authorMatches = !authors.length || authors.includes(activity.user?.name ?? '');
	const typeMatches =
		!types.length || [activity, ...activity.children].some(({ type }) => types.includes(type));

	return authorMatches && typeMatches;
};
