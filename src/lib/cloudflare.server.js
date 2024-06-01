import { CLOUDFLARE_API_KEY, CLOUDFLARE_ZONE_ID, VITE_DOMAIN } from "$env/static/private";

const headers = new Headers({ 'content-type': 'application/json', 'X-Auth-Key': CLOUDFLARE_API_KEY });


/** @param {string} zoneId */
const url = `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache`;

/**
 * @param {string} title
 */
export const invalidateArticleCache = async (title) => {
	if (!CLOUDFLARE_API_KEY || !CLOUDFLARE_ZONE_ID) return;
	if (!title) return;
	
	const body = {
		files: [new URL(`/w/${title}`, VITE_DOMAIN)]
	};

	try {
		await fetch(url, { method: 'POST', body: JSON.stringify(body), headers });
	} catch (error) {
		console.warn(error);
	}
};
