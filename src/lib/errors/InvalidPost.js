import { error } from '@sveltejs/kit';

export const InvalidPost = (message = 'InvalidPost') => {
	error(400, {
		message,
	});
};
