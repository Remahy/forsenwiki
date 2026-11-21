// Must match the ActivityType enum in prisma/schema.prisma.
export const ACTIVITY_TYPES = /** @type {const} */ ({
	ARTICLE_CREATE: 'ARTICLE_CREATE',
	ARTICLE_UPDATE: 'ARTICLE_UPDATE',
	ARTICLE_RENAME: 'ARTICLE_RENAME',
	ARTICLE_RETAG: 'ARTICLE_RETAG',
	USER_REGISTER: 'USER_REGISTER',
	USER_RENAME: 'USER_RENAME',
	CONTENT_UPLOAD: 'CONTENT_UPLOAD',
	CONTENT_DELETE: 'CONTENT_DELETE',
	CONTENT_RENAME: 'CONTENT_RENAME',
});

/**
 * @typedef {typeof ACTIVITY_TYPES[keyof typeof ACTIVITY_TYPES]} ActivityType
 */

export const AVAILABLE_ACTIVITY_TYPES = Object.values(ACTIVITY_TYPES);

/** @type {ActivityType[]} */
export const MODERATOR_ACTIVITY_TYPES = [ACTIVITY_TYPES.USER_RENAME];

/** @type {Record<ActivityType, string>} */
export const ACTIVITY_TYPE_LABELS = {
	ARTICLE_CREATE: 'New article',
	ARTICLE_UPDATE: 'Article update',
	ARTICLE_RENAME: 'Title change',
	ARTICLE_RETAG: 'Tag change',
	USER_REGISTER: 'New user',
	USER_RENAME: 'Username change',
	CONTENT_UPLOAD: 'Content upload',
	CONTENT_DELETE: 'Content deletion',
	CONTENT_RENAME: 'Content rename',
};

export const CONVERTED_EXPLANATION = 'Converted to a newer format.';
export const FORCED_CONVERSION_EXPLANATION = 'Forceful conversion to a newer format.';
export const MISSING_ARTICLE_LINKS_EXPLANATION = "Submitted with links to posts that don't exist.";
