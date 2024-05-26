import { STATIC_DOMAIN } from '$lib/environment/environment';

const cacheServiceBaseURL = 'https://wsrv.nl';
const csbURL = new URL('', cacheServiceBaseURL);
csbURL.searchParams.append('url', STATIC_DOMAIN + '/');
export const cacheServiceBaseURLWithStatic = csbURL.toString();

/**
 * @param {string} hash
 * @param {string} name
 */
export const getCacheURL = (hash, name) => {
	const url = new URL('', cacheServiceBaseURL);

	const ourUrl = new URL(hash, STATIC_DOMAIN + '/');

	url.searchParams.append('url', ourUrl.toString());
	url.searchParams.append('filename', name);
	url.searchParams.append('n', '-1');

	return url;
};
