import { json, error } from '@sveltejs/kit';
import { readYPostsByIds, readYPostByTitle, readYPostUpdatesByTitle } from '$lib/db/post/read';
import { yPostUpdatesV2ToBase64 } from '$lib/yjs/utils';
import { upsertHTML } from '$lib/db/post/html';
import { updateToHTML } from '$lib/lexical/updateToHTML';
import { replacer } from '$lib/utils/json';
import { sanitizeTitle } from '$lib/components/editor/utils/sanitizeTitle';

/**
 * @param {string} title
 * @throws {number}
 */
export const _getYPostByTitle = async (title) => {
	const post = await readYPostUpdatesByTitle(title);

	if (!post) {
		throw 404;
	}

	const base64String = yPostUpdatesV2ToBase64(post.postUpdates);

	// Important: We're destructuring away postUpdates to make sure we don't return it.
	const { postUpdates, ..._post } = post;

	const originalAuthorId = postUpdates[0].metadata.userId;

	return { ..._post, update: base64String, originalAuthorId };
};

/**
 * @param {string} title
 * @param {boolean} [shouldCacheBust]
 */
export const _getYPostHTML = async (title, shouldCacheBust) => {
	try {
		const yPost = await readYPostByTitle(title);

		if (yPost?.html?.content && !shouldCacheBust) {
			return {
				post: { ...yPost, html: undefined },
				html: yPost.html.content,
				text: yPost.html.text,
				image: yPost.html.image,
			};
		}
	} catch (err) {
		if (typeof err === 'number') {
			return error(err);
		}

		throw err;
	}

	const { post, update } = await _getYPostUpdate(title);

	if (!update) {
		return { post, html: null, text: null, image: null };
	}

	const { html, text, image } = await updateToHTML(update);

	Promise.resolve(upsertHTML(post.id, { content: html, text, image }));

	return { post, html, text, image };
};

/**
 * @param {string} title
 */
export const _getYPostUpdate = async (title) => {
	const { update: update, ...yPost } = await _getYPostByTitle(title);

	return {
		post: yPost,
		update,
	};
};

/**
 * @param {string[]} ids
 */
export const _getYPostsByIds = (ids) => {
	return readYPostsByIds(ids);
};

export async function GET({ params }) {
	const { sanitized: title } = sanitizeTitle(params.title);

	try {
		const res = await _getYPostHTML(title);

		const safeJSON = JSON.parse(JSON.stringify(res, replacer));

		return json(safeJSON);
	} catch (err) {
		if (typeof err === 'number') {
			return error(err);
		}

		throw err;
	}
}
