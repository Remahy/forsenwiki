import { error } from '@sveltejs/kit';

/** @param {string} message */
<<<<<<<< HEAD:src/lib/errors/ArticleError.js
export const ArticleError = (message = 'ArticleError') => {
========
export const InvalidPost = (message = 'InvalidPost') => {
>>>>>>>> main:src/lib/errors/InvalidPost.js
	error(400, {
		message,
	});
};
