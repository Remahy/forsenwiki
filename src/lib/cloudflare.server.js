import { CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID } from '$env/static/private';
import { DOMAIN } from './environment/environment';

const headers = new Headers({
	'content-type': 'application/json',
	Authorization: `Bearer ${CLOUDFLARE_API_TOKEN || ''}`,
});

const url = `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache`;

// Maximum Cloudflare purges per request.
const MAX_FILES_PER_PURGE = 30;

// x-sveltekit-invalidated has one digit per server load, the root layout then the page. Client
// navigations ask for "01", or "11" when the root layout reruns too.
/**
 * @param {string} title
 */
const postURLs = (title) => [
	new URL(`/w/${title}`, DOMAIN).href,
	new URL(`/w/${title}/__data.json?x-sveltekit-invalidated=01`, DOMAIN).href,
	new URL(`/w/${title}/__data.json?x-sveltekit-invalidated=11`, DOMAIN).href,
	new URL(`/w/${title}/edit`, DOMAIN).href,
	new URL(`/w/${title}/edit/__data.json?x-sveltekit-invalidated=01`, DOMAIN).href,
	new URL(`/w/${title}/edit/__data.json?x-sveltekit-invalidated=11`, DOMAIN).href,
];

/**
 * @param {string[]} files
 */
const purge = async (files) => {
	try {
		const res = await fetch(url, { method: 'POST', body: JSON.stringify({ files }), headers });
		const json = await res.json().catch(() => null);

		if (!res.ok || !json?.success) {
			console.warn(`Cloudflare cache purge failed (${res.status}):`, JSON.stringify(json?.errors));
		}
	} catch (err) {
		console.warn(err);
	}
};

/**
 * @param {string[]} titles
 */
export const invalidatePostCache = async (titles) => {
	if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ZONE_ID) {
		return;
	}

	const files = [...new Set(titles.filter(Boolean))].flatMap(postURLs);

	for (let index = 0; index < files.length; index += MAX_FILES_PER_PURGE) {
		await purge(files.slice(index, index + MAX_FILES_PER_PURGE));
	}
};

const validationURL = 'https://api.cloudflare.com/client/v4/user/tokens/verify';

export const validateToken = async () => {
	const res = await fetch(validationURL, { method: 'GET', headers });

	const json = await res.json();

	return json.success;
};
