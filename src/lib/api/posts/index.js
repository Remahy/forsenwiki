import { encodeYDocToUpdateV2ToBase64 } from '$lib/yjs/utils';

/**
 * @typedef {import('$lib/constants/constants').Y_POST_TYPES_VALUES} Y_POST_TYPES_VALUES
 */

const headers = new Headers({ 'content-type': 'application/json' });

/**
 * @param {string} title
 * @param {Y_POST_TYPES_VALUES} type
 * @param {YDoc} yDoc
 */
export const createPost = async (title, type, yDoc) => {
	const encodedContent = encodeYDocToUpdateV2ToBase64(yDoc);

	const body = JSON.stringify({ title, content: encodedContent });

	const { length } = new TextEncoder().encode(body);

	const TEN_MiB = 10 * 1024 * 1024;

	if (length > TEN_MiB) {
		const error = new Error(
			`Body of ${length} (~${(length / 1_048_576).toFixed(2)} MiB) exceeds limit of ${TEN_MiB} bytes (10 MiB). Submit a smaller snippet of your article and add to it afterwards.`
		);
		throw error;
	}

	return fetch('/api/post/create', { method: 'POST', body, headers });
};

/**
 * @param {string} postTitle
 * @param {YDoc} yDoc
 * @param {string} newTitle
 */
export const updatePost = async (postTitle, yDoc, newTitle) => {
	const encodedContent = encodeYDocToUpdateV2ToBase64(yDoc);

	const body = JSON.stringify({ content: encodedContent, newTitle });

	return fetch(`/api/post/update/${postTitle}`, { method: 'POST', body, headers });
};
