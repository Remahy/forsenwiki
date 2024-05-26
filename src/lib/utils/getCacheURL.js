import { STATIC_DOMAIN } from '$lib/environment/environment';

const cacheServiceBaseURL = 'https://wsrv.nl';
const csbURL = new URL('', cacheServiceBaseURL);
csbURL.searchParams.append('url', STATIC_DOMAIN + '/');
export const cacheServiceBaseURLWithStatic = csbURL.toString();

/**
 * @param {string} hash
 * @param {string} name
 * @param {{ width?: 'inherit' | number, height?: 'inherit' | number }} opts
 */
export const getCacheURL = (hash, name, opts = {}) => {
	const url = new URL('', cacheServiceBaseURL);

	const ourUrl = new URL(hash, STATIC_DOMAIN + '/');

	url.searchParams.append('url', ourUrl.toString());
	url.searchParams.append('filename', name);
	url.searchParams.append('n', '-1');

	if (opts) {
		if (typeof opts.width === 'number') {
			url.searchParams.append('w', String(opts.width));
		}

		if (typeof opts.height === 'number') {
			url.searchParams.append('h', String(opts.height));
		}
	}

	return url;
};
