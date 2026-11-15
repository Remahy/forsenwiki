const SNIPPET_LENGTH = 150;

/**
 * @param {string} text
 */
export const toSnippet = (text, length = SNIPPET_LENGTH) =>
	`${text.substring(0, length)}${text.length > length ? '...' : ''}`;
