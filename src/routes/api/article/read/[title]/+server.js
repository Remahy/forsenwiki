import { json, error } from '@sveltejs/kit';
import { base64ToUint8Array } from 'uint8array-extras';

import { articleConfig } from '$lib/components/editor/config/article';
import { getYjsAndEditor } from '$lib/yjs/getYjsAndEditor';
import { toHTML } from '$lib/lexicalHTML.server';
import { readYPostUpdatesByTitle } from '$lib/db/article/read';
import { yPostUpdatesToBase64 } from '$lib/yjs/utils';

/**
 * @param {string} title
 * @throws {number}
 */
export const _getYPostByTitle = async (title) => {

	const post = await readYPostUpdatesByTitle(title)

	if (!post) throw 404;

	const base64String = yPostUpdatesToBase64(post.postUpdates)

	// Important: Make sure to set postUpdates to undefined or else user receives all content updates.
	return { ...post, postUpdates: undefined, update: base64String }
}

/** @param {string} title */
export const _getYPostAndHtml = async (title) => {
	let yPost;

	try {
		yPost = await _getYPostByTitle(title)
	} catch (err) {
		if (typeof err === 'number') {
			throw err
		}

		throw err;
	}

	const { update } = yPost;

	/** @type {LexicalEditor} */
	let editor;
	/** @type {string} */
	let html;
	try {
		let e = getYjsAndEditor(articleConfig(null, false, null), base64ToUint8Array(update))
		editor = e.editor;

		html = await toHTML(editor);

	} catch (err) {
		throw 500
	}

	return {
		post: yPost,
		update,
		html,
	};
};

export async function GET({ params }) {
	let res;

	try {
		res = await _getYPostAndHtml(params.title);

	} catch (err) {
		if (typeof err === 'number') {
			return error(err);
		}

		throw err;
	}

	return json(res)
}
