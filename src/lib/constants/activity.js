// Must match the ActivityType enum in prisma/schema.prisma.
export const ACTIVITY_TYPES = /** @type {const} */ ({
	ARTICLE_CREATE: 'ARTICLE_CREATE',
	ARTICLE_UPDATE: 'ARTICLE_UPDATE',
	ARTICLE_RENAME: 'ARTICLE_RENAME',
	USER_REGISTER: 'USER_REGISTER',
});

/**
 * @typedef {typeof ACTIVITY_TYPES[keyof typeof ACTIVITY_TYPES]} ActivityType
 */

export const AVAILABLE_ACTIVITY_TYPES = Object.values(ACTIVITY_TYPES);

/** @type {Record<ActivityType, string>} */
export const ACTIVITY_TYPE_LABELS = {
	ARTICLE_CREATE: 'New article',
	ARTICLE_UPDATE: 'Article update',
	ARTICLE_RENAME: 'Title change',
	USER_REGISTER: 'New user',
};

export const CONVERTED_EXPLANATION = 'Converted to a newer format.';
export const FORCED_CONVERSION_EXPLANATION = 'Forceful conversion to a newer format.';
