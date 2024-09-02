import { json, error } from '@sveltejs/kit';
import { base64ToUint8Array } from 'uint8array-extras';

import { articleConfig } from '$lib/components/editor/config/article';
import { getYjsAndEditor } from '$lib/yjs/getYjsAndEditor';
import { toHTML } from '$lib/lexicalHTML.server';
import { readYPostByTitle, readYPostUpdatesByTitle } from '$lib/db/article/read';
import { yPostUpdatesToBase64 } from '$lib/yjs/utils';
import { upsertHTML } from '$lib/db/article/html.js';

/**
 * TODO: Move elsewhere.
 * @param {string} update
 */
export const _updateToHTML = async (update) => {
	try {
		const { editor } = getYjsAndEditor(articleConfig(null, false, null), base64ToUint8Array(update));

		const html = await toHTML(editor);

		return html;
	} catch (err) {
		console.error(err);
		throw 500;
	}
};

/**
 * @param {string} title
 * @throws {number}
 */
export const _getYPostByTitle = async (title) => {
	const post = await readYPostUpdatesByTitle(title);

	if (!post) {
		throw 404;
	}

	const base64String = yPostUpdatesToBase64(post.postUpdates);

	// Important: We're destructuring away postUpdates to make sure we don't return it.
	// eslint-disable-next-line no-unused-vars
	const { postUpdates, ..._post } = post;

	return { ..._post, update: base64String };
};

/**
 * @param {string} title
 */
export const _getYPostHTML = async (title) => {
	try {
		const yPost = await readYPostByTitle(title);

		if (yPost?.html?.content) {
			return { post: { ...yPost, html: undefined }, html: yPost.html.content };
		}
	} catch (err) {
		if (typeof err === 'number') {
			return error(err);
		}

		throw err;
	}

	const { post, update } = await _getYPostUpdate(title);

	const html = await _updateToHTML(update);

	Promise.resolve(upsertHTML(post.id, html));

	return { post, html };
};

/**
 * @param {string} title
 */
export const _getYPostUpdate = async (title) => {
	let yPost;
	let update;
	try {
		const { update: _update, ..._yPost } = await _getYPostByTitle(title);
		yPost = _yPost;
		update = _update;
	} catch (err) {
		if (typeof err === 'number') {
			throw err;
		}

		throw err;
	}

	return {
		post: yPost,
		update,
	};
};

export async function GET({ params }) {
	try {
		const res = await _getYPostHTML(params.title);

		return json(res);
	} catch (err) {
		if (typeof err === 'number') {
			return error(err);
		}

		throw err;
	}
}
