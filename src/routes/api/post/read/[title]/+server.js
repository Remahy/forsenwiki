import { json, error } from '@sveltejs/kit';
import { readYPostsByIds, readYPostByTitle, readYPostUpdatesByTitle } from '$lib/db/post/read';
import { yPostUpdatesV2ToBase64 } from '$lib/y/utils';
import { LEXICAL_Y, NOT_CONVERTED_MESSAGE, readableRows } from '$lib/y/rows';
import { upsertHTML } from '$lib/db/post/html';
import { updateToHTML } from '$lib/lexical/updateToHTML';
import { replacer } from '$lib/utils/json';
import { sanitizeTitle } from '$lib/components/editor/utils/sanitizeTitle';

/**
 * @param {string} title
 * @throws {number}
 */
const readArticle = async (title) => {
	const post = await readYPostUpdatesByTitle(title);

	if (!post) {
		throw 404;
	}

	// Important: We're destructuring away postUpdates to make sure we don't return it.
	const { postUpdates, ..._post } = post;

	const { format, rows } = readableRows(postUpdates);

	return {
		post: { ..._post, originalAuthorId: postUpdates[0].metadata.userId },
		format,
		// System posts have no content.
		update: rows.length ? yPostUpdatesV2ToBase64(rows) : null,
	};
};

/**
 * @param {string} title
 * @throws {number}
 */
export const _getYPostByTitle = async (title) => {
	const { post, format, update } = await readArticle(title);

	if (update && format !== LEXICAL_Y) {
		// See scripts/convertPostsToLexicalY.js.
		error(503, NOT_CONVERTED_MESSAGE);
	}

	return { ...post, update };
};

/**
 * @param {string} title
 */
export const _getYPostUpdate = async (title) => {
	const { update, ...yPost } = await _getYPostByTitle(title);

	return {
		post: yPost,
		update,
	};
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

	const { post, format, update } = await readArticle(title);

	if (!update) {
		return { post, html: null, text: null, image: null };
	}

	const { html, text, image } = await updateToHTML(update, format);

	Promise.resolve(upsertHTML(post.id, { content: html, text, image }));

	return { post, html, text, image };
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
