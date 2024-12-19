import 'linkedom-global';

import { workerData, parentPort } from 'node:worker_threads';

const headers = new Headers();
headers.set('User-Agent', 'facebookexternalhit/1.1');

export const youtubeClipURLWorker = async (data) => {
	/**
	 * @type {{ url: string }}
	 */
	const { url } = data || workerData || {};

	const parsedURL = new URL('', url);

	if (parsedURL.hostname !== 'www.youtube.com' && parsedURL.hostname !== 'youtube.com') {
		parentPort?.postMessage(url);

		return url;
	}

	const text = await (await fetch(url, { headers })).text();

	const html = new DOMParser().parseFromString(text, 'text/html');

	/** @type {HTMLMetaElement?} */
	let metaVideoURLTag;
	try {
		metaVideoURLTag = html.querySelector('meta[property="og:video:url"]');
	} catch {
		// noop
	}

	parentPort?.postMessage(metaVideoURLTag?.content || url);

	return metaVideoURLTag?.content || url;
};

if (workerData) {
	try {
		youtubeClipURLWorker();
	} catch (error) {
		console.error('toHTMLWorker error', error);
	}
}
