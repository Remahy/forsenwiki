import { json, error } from '@sveltejs/kit';
import { base64ToUint8Array } from 'uint8array-extras';

import { articleConfig } from '$lib/components/editor/config/article';
import { updateToJSON } from '$lib/yjs/updateToJSON';
import { toHTML } from '$lib/lexicalHTML.server';
import { readArticleUpdatesByPostId, readLatestArticleUpdateByPostId } from '$lib/db/article/read';
import { yPostUpdatesToBase64 } from '$lib/yjs/utils';

/** @param {string} id @throws {number} */
export const _getYPost = async (id) => {

	const post = await readArticleUpdatesByPostId(id)

	if (!post) throw 404;

	const base64String = yPostUpdatesToBase64(post.postUpdates)

	// Use latest ONE postUpdate for post.postUpdates.
	/** @type {{ title: string }[]} */
	const postUpdates = /** @type {any} */(await readLatestArticleUpdateByPostId(id)).postUpdates;

	return { post: { ...post, postUpdates }, update: base64String }
}

/** @param {string} id */
export const _getYPostAndHtml = async (id) => {
	let post;

	try {
		post = await _getYPost(id)
	} catch (err) {
		if (typeof err === 'number') {
			throw err
		}

		throw err;
	}

	if (!post) {
		throw 500;
	}

	const { update, post: { postUpdates } } = post;
	const title = postUpdates[0].title;

	/** @type {LexicalEditor} */
	let editor;
	/** @type {string} */
	let html;
	try {
		editor = updateToJSON(articleConfig({}, false, null), base64ToUint8Array(update))
		html = await toHTML(editor);

	} catch (err) {
		throw 500
	}

	return {
		title,
		post: post.post,
		update,
		html,
	};
};

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
	let res;

	try {
		res = await _getYPostAndHtml(params.id);

	} catch (err) {
		if (typeof err === 'number') {
			return error(err);
		}

		throw err;
	}

	return json(res)
}
