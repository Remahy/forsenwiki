import 'linkedom-global';

/**
 * @typedef {{ kind: 'video'; id: string } | { kind: 'clip'; slug: string }} TwitchRef
 */

/**
 * @param {string} input
 * @returns {TwitchRef | null}
 */
const parseTwitchUrl = (input) => {
	/** @type {URL} */
	let url;
	try {
		url = new URL(input);
	} catch {
		return null;
	}

	const host = url.hostname.replace(/^(www|m)\./, '');
	const parts = url.pathname.split('/').filter(Boolean);

	// https://www.twitch.tv/videos/<id>
	if (host === 'twitch.tv' && parts[0] === 'videos' && /^\d+$/.test(parts[1] ?? '')) {
		return { kind: 'video', id: parts[1] };
	}

	// https://www.twitch.tv/<channel>/clip/<slug>
	if (host === 'twitch.tv' && parts[1] === 'clip' && parts[2]) {
		return { kind: 'clip', slug: parts[2] };
	}

	if (host === 'clips.twitch.tv') {
		// https://clips.twitch.tv/embed?clip=<slug>
		const embedSlug = url.searchParams.get('clip');
		if (parts[0] === 'embed' && embedSlug) {
			return { kind: 'clip', slug: embedSlug };
		}

		// https://clips.twitch.tv/<slug>
		if (parts[0]) {
			return { kind: 'clip', slug: parts[0] };
		}
	}

	return null;
};

/**
 * Canonical page URL to scrape. All clip URL forms map to clips.twitch.tv/<slug>.
 * @param {TwitchRef} ref
 */
const canonicalPageUrl = (ref) =>
	ref.kind === 'video'
		? `https://www.twitch.tv/videos/${ref.id}`
		: `https://clips.twitch.tv/${encodeURIComponent(ref.slug)}`;

const CRAWLER_USER_AGENTS = [
	'facebookexternalhit/1.1',
	'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
	'Twitterbot/1.0',
	'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
];

/**
 * @param {Document} doc
 * @param {string} key
 */
const getMetaContent = (doc, key) => {
	const el = doc.querySelector(`meta[property="${key}"], meta[name="${key}"]`);
	return el?.getAttribute('content')?.trim() || null;
};

/**
 * @param {{ url: string }} data
 */
export const twitchThumbnailURL = async ({ url }) => {
	const ref = parseTwitchUrl(url);
	if (!ref) {
		throw new Error(`Not a recognized Twitch VOD/clip URL: ${url}`);
	}

	const pageUrl = canonicalPageUrl(ref);

	for (const ua of CRAWLER_USER_AGENTS) {
		/** @type {string} */
		let text;

		try {
			const res = await fetch(pageUrl, {
				headers: { 'User-Agent': ua, Accept: 'text/html' },
				redirect: 'follow',
				signal: AbortSignal.timeout(1_000),
			});

			if (res.status === 404) {
				return null;
			}

			if (!res.ok) {
				continue;
			}

			text = await res.text();
		} catch {
			continue;
		}

		const html = new DOMParser().parseFromString(text, 'text/html');
		const image = getMetaContent(html, 'og:image') ?? getMetaContent(html, 'twitter:image');

		if (image) {
			return image;
		}
	}

	return null;
};
