import 'linkedom-global';

import { workerData, parentPort, isMainThread } from 'node:worker_threads';

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

	const text = await (await fetch(url, { headers })).text();

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

if (!isMainThread && parentPort && workerData) {
	youtubeClipURLWorker(workerData).then(
		(url) => parentPort.postMessage({ url }),
		(err) => parentPort.postMessage({ error: String(err?.message ?? err) })
	);
}
