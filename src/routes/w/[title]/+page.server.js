import { error } from '@sveltejs/kit';
import { readAuthorsForYPostByTitle, readRelationsToYPostTitle } from '$lib/db/post/read';
import { sanitizeTitle } from '$lib/components/editor/utils/sanitizeTitle';
import { _getYPostHTML } from '../../api/post/read/[title]/+server';
import { getShouldCacheBust } from '$lib/utils/cacheBust';

/** @type {Map<string, number>} */
const cacheBustRateLimit = new Map();

/**
 * @param {string} title
 * @param {URL} url
 */
const getShouldCacheBustUsingURLParam = (title, url) => {
	const { searchParams } = url;

	let cacheBust = searchParams.has('cachebust');

	if (cacheBust) {
		cacheBust = getShouldCacheBust(cacheBustRateLimit, title);
	}

	return cacheBust;
};

export async function load({ params, url, setHeaders }) {
	const { sanitized: title } = sanitizeTitle(params.title);

	const shouldCacheBust = getShouldCacheBustUsingURLParam(title, url);

	try {
		const res = await _getYPostHTML(title, shouldCacheBust);

		const authors = await readAuthorsForYPostByTitle(res.post.title);

		const relatedPosts = await readRelationsToYPostTitle(res.post.title);

		setHeaders({
			Title: encodeURIComponent(res.post.rawTitle),
		});

		if (res) {
			if (res.text) {
				res.text = `${res.text.substring(0, 150)}${res.text.length > 150 ? '...' : ''}`;
			}

			return { ...res, authors, relatedPosts };
		}

		return error(404, 'Not found');
	} catch (err) {
		if (typeof err === 'number') {
			return error(err);
		}

		throw err;
	}
}
