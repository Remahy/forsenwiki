import './registerDOM.js';

import { handleJobs } from './handleJobs.js';

const headers = new Headers();
headers.set('User-Agent', 'facebookexternalhit/1.1');

/**
 * @param {{ url: string }} data
 */
export const youtubeClipURLWorker = async ({ url }) => {
	const parsedURL = new URL('', url);

	if (parsedURL.hostname !== 'www.youtube.com' && parsedURL.hostname !== 'youtube.com') {
		return url;
	}

	// Fail this request on its own otherwise the worker's timeout would stop every job in it.
	const res = await fetch(url, { headers, signal: AbortSignal.timeout(10_000) });
	const text = await res.text();

	const html = new DOMParser().parseFromString(text, 'text/html');

	/** @type {HTMLMetaElement?} */
	let metaVideoURLTag;
	try {
		metaVideoURLTag = html.querySelector('meta[property="og:video:url"]');
	} catch {
		// noop
	}

	return metaVideoURLTag?.content || url;
};

handleJobs(youtubeClipURLWorker);
