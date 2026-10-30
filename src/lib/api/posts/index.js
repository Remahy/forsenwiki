import { encodeYDocToUpdateV2ToBase64 } from '$lib/yjs/utils';

/**
 * @typedef {import('$lib/constants/constants').Y_POST_TYPES_VALUES} Y_POST_TYPES_VALUES
 */

const headers = new Headers({ 'content-type': 'application/json' });

/**
 * @param {object} Arg
 * @param {string} Arg.title
 * @param {Y_POST_TYPES_VALUES} Arg.type
 * @param {YDoc} Arg.yDoc
 * @param {string[]} [Arg.disclaimerTags]
 */
export const createPost = async ({ title, type, yDoc, disclaimerTags = [] }) => {
	const encodedContent = encodeYDocToUpdateV2ToBase64(yDoc);

	/** @type {import('../../../routes/api/post/create/+server').CreateBody} */
	const createBody = { title, content: encodedContent, type, disclaimerTags };
	const body = JSON.stringify(createBody);

	const { length } = new TextEncoder().encode(body);

	const TEN_MiB = 10 * 1024 * 1024;

	if (length > TEN_MiB) {
		const error = new Error(
			`Body of ${length} (~${(length / 1_048_576).toFixed(2)} MiB) exceeds limit of ${TEN_MiB} bytes (10 MiB). Refresh page & submit a smaller snippet of your article and add to it afterwards.`
		);
		throw error;
	}

	return fetch('/api/post/create', { method: 'POST', body, headers });
};

/**
 * @param {object} Arg
 * @param {string} Arg.postTitle
 * @param {YDoc} Arg.yDoc
 * @param {string} Arg.newTitle
 * @param {string[]} [Arg.disclaimerTags] - Only applied for moderators.
 */
export const updatePost = async ({ postTitle, yDoc, newTitle, disclaimerTags }) => {
	const encodedContent = encodeYDocToUpdateV2ToBase64(yDoc);

	/** @type {import('../../../routes/api/post/update/[title]/+server').UpdateBody} */
	const updateBody = { content: encodedContent, newTitle, disclaimerTags };
	const body = JSON.stringify(updateBody);

	return fetch(`/api/post/update/${postTitle}`, { method: 'POST', body, headers });
};

/**
 * @param {object} Arg
 * @param {string} Arg.postTitle
 */
export const readPost = ({ postTitle }) => {
	return fetch(`/api/post/read/${postTitle}`, { headers });
};
