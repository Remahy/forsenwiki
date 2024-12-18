import 'linkedom-global';

import { workerData, parentPort } from 'node:worker_threads';

const youtubeClipURLWorker = async () => {
	/**
	 * @type {{ url: string }}
	 */
	const { url } = workerData;

	const parsedURL = new URL('', url);

	if (parsedURL.hostname !== 'www.youtube.com' && parsedURL.hostname !== 'youtube.com') {
		parentPort?.postMessage(url);

		return;
	}

	const text = await (await fetch(url)).text();

	const html = new DOMParser().parseFromString(text, 'text/html');

	/** @type {HTMLMetaElement?} */
	let metaVideoURLTag;
	try {
		metaVideoURLTag = html.querySelector('meta[property="og:video:url"]');
	} catch {
		// noop
	}

	parentPort?.postMessage(metaVideoURLTag?.content || url);
};

try {
	youtubeClipURLWorker();
} catch (error) {
	console.error('toHTMLWorker error', error);
}
