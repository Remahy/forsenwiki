import { encodeYDocToUpdateV2ToBase64 } from '$lib/yjs/utils';

const headers = new Headers({ 'content-type': 'application/json' });

/**
 * @param {string} title
 * @param {YDoc} yDoc
 */
export const createArticle = async (title, yDoc) => {
	const encodedContent = encodeYDocToUpdateV2ToBase64(yDoc);

	const body = JSON.stringify({ title, content: encodedContent });

	const { length } = new TextEncoder().encode(body);

	// 10MB
	if (length > 1_048_576) {
		const error = new Error(`Body of ${length} exceeds limit of ${1_048_576} bytes. Submit a smaller snippet of your article and add to it afterwards.`);
		throw error;
	}

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
