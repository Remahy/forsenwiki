import { encodeYDocToUpdateV2ToBase64 } from '$lib/yjs/utils';

const headers = new Headers({ 'content-type': 'application/json' });

/**
 * @param {string} title
 * @param {YDoc} yDoc
 */
export const createArticle = async (title, yDoc) => {
	const encodedContent = encodeYDocToUpdateV2ToBase64(yDoc);

	const body = JSON.stringify({ title, content: encodedContent });

	return fetch('/api/article/create', { method: 'POST', body, headers });
};

/**
 * @param {string} postTitle
 * @param {YDoc} yDoc
 * @param {string} newTitle
 */
export const updateArticle = async (postTitle, yDoc, newTitle) => {
	const encodedContent = encodeYDocToUpdateV2ToBase64(yDoc);

	const body = JSON.stringify({ content: encodedContent, newTitle });

	return fetch(`/api/article/update/${postTitle}`, { method: 'POST', body, headers });
};
