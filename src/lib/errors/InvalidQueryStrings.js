import { error } from '@sveltejs/kit';

/** @param {string} message */
export const InvalidQueryStrings = (message = 'InvalidQuerystrings') => {
	error(400, {
		message,
	});
};
