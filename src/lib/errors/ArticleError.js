import { error } from '@sveltejs/kit';

/** @param {string} message */
export const ArticleError = (message = 'ArticleError') => {
	error(400, {
		message,
	});
};
