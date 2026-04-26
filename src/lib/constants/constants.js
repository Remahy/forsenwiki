export const Y_POST_TYPES = /** @type {const} */ ({
	ARTICLE: 'article',
	BIO: 'bio',
});

export const AVAILABLE_Y_POST_TYPES = Object.values(Y_POST_TYPES);

/**
 * @typedef {keyof typeof Y_POST_TYPES} Y_POST_TYPES_KEYS
 * @typedef {typeof Y_POST_TYPES[Y_POST_TYPES_KEYS]} Y_POST_TYPES_VALUES
 */

export const SYSTEM = 'system';

export const EDITOR_IS_EDITABLE = true;
export const EDITOR_IS_READONLY = false;

export const WIKI_PATH = '/w/';
