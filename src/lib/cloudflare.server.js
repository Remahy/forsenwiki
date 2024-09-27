import { CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID } from '$env/static/private';
import { DOMAIN } from './environment/environment';

const headers = new Headers({
	'content-type': 'application/json',
	Authorization: `Bearer ${CLOUDFLARE_API_TOKEN || ''}`,
});

const url = `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache`;

/**
 * @param {string} title
 */
export const invalidateArticleCache = async (title) => {
	if (!title || !CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ZONE_ID) {
		return;
	}

	const body = {
		files: [
			new URL(`/w/${title}`, DOMAIN),
			new URL(`/w/${title}/__data.json?x-sveltekit-invalidated=010`, DOMAIN),
			new URL(`/w/${title}/edit`, DOMAIN),
			new URL(`/w/${title}/edit/__data.json?x-sveltekit-invalidated=010`, DOMAIN),
		],
	};

	try {
		await fetch(url, { method: 'POST', body: JSON.stringify(body), headers });
	} catch (error) {
		console.warn(error);
	}
};

const validationURL = 'https://api.cloudflare.com/client/v4/user/tokens/verify';

export const validateToken = async () => {
	const res = await fetch(validationURL, { method: 'GET', headers });

	const json = await res.json();

	return json.success;
};
