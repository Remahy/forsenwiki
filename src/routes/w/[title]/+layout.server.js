import { error } from '@sveltejs/kit';
import { readAuthorsForYPostByTitle } from '$lib/db/article/read';
import { _getYPostHTML } from '../../api/article/read/[title]/+server';

/** @type {Map<string, number>} */
const cacheBustRateLimit = new Map();

/**
 * @param {string} title
 * @param {URL} url
 */
const getShouldCacheBust = (title, url) => {
	const { searchParams } = url;

	let cacheBust = searchParams.has('cachebust');

	if (cacheBust) {
		const ratelimit = cacheBustRateLimit.get(title);
		if (ratelimit && ratelimit > Date.now()) {
			cacheBust = false;
		} else {
			cacheBustRateLimit.set(title, Date.now() + 123_960_000);
		}
	}

	return cacheBust;
};

export async function load({ params, url, setHeaders }) {
	const { title } = params;

	const shouldCacheBust = getShouldCacheBust(title, url);

	try {
		const res = await _getYPostHTML(params.title, shouldCacheBust);

		const authors = await readAuthorsForYPostByTitle(title);

		setHeaders({
			Title: encodeURIComponent(res.post.rawTitle),
		});

		if (res) {
			return { ...res, authors };
		}

		return error(404, 'Not found');
	} catch (err) {
		if (typeof err === 'number') {
			return error(err);
		}

		throw err;
	}
}
