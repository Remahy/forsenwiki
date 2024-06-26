import { json, error } from '@sveltejs/kit';
import { base64ToUint8Array } from 'uint8array-extras';

import { articleConfig } from '$lib/components/editor/config/article';
import { getYjsAndEditor } from '$lib/yjs/getYjsAndEditor';
import { toHTML } from '$lib/lexicalHTML.server';
import { readYPostByTitle, readYPostUpdatesByTitle } from '$lib/db/article/read';
import { yPostUpdatesToBase64 } from '$lib/yjs/utils';
import { upsertHTML } from '$lib/db/article/html.js';

/**
 * @param {string} title
 * @throws {number}
 */
export const _getYPostByTitle = async (title) => {
	const post = await readYPostUpdatesByTitle(title);

	if (!post) throw 404;

	const base64String = yPostUpdatesToBase64(post.postUpdates);

	// Important: We're destructuring away postUpdates to make sure we don't return it.
	// eslint-disable-next-line no-unused-vars
	const { postUpdates, ..._post } = post;

	return { ..._post, update: base64String };
};

/** @param {string} title @param {{ html?: boolean, update?: boolean }} returnProps */
export const _getYPost = async (title, returnProps = { html: true, update: true }) => {
	const { html: returnHTML = true, update: returnUpdate = true } = returnProps;

	if (!returnUpdate && returnHTML) {
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
	}

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

	/** @type {LexicalEditor} */
	let editor;
	/** @type {string} */
	let html;
	try {
		let e = getYjsAndEditor(articleConfig(null, false, null), base64ToUint8Array(update));
		editor = e.editor;

		html = await toHTML(editor);
	} catch (err) {
		console.error(err);
		throw 500;
	}

	Promise.resolve(upsertHTML(yPost.id, html));

	return {
		post: yPost,
		update: returnUpdate ? update : undefined,
		html: returnHTML ? html : undefined,
	};
};

export async function GET({ params }) {
	let res;

	try {
		res = await _getYPost(params.title, { update: false });
	} catch (err) {
		if (typeof err === 'number') {
			return error(err);
		}

		throw err;
	}

	return json(res);
}
