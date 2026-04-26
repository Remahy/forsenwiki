import { error } from '@sveltejs/kit';

/** @param {string} message */
export const InvalidPost = (message = 'InvalidPost') => {
	error(400, {
		message,
	});
};
