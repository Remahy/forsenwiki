import { STATIC_DOMAIN } from '$lib/environment/environment';

// const cacheServiceBaseURL = 'https://wsrv.nl';
// const csbURL = new URL('', cacheServiceBaseURL);
// csbURL.searchParams.append('url', STATIC_DOMAIN + '/');
export const cacheServiceBaseURLWithStatic = STATIC_DOMAIN;

/**
 * @param {string} hash
 * @param {string} name
 * @param {{ width?: 'inherit' | number, height?: 'inherit' | number }} opts
 */
export const getCacheURL = (hash, name, opts = {}) => {
	// const url = new URL('', cacheServiceBaseURL);

	const ourUrl = new URL(hash, STATIC_DOMAIN + '/');


	// url.searchParams.append('url', ourUrl.toString());
	ourUrl.searchParams.append('filename', name);
	ourUrl.searchParams.append('n', '-1');

	if (opts) {
		if (typeof opts.width === 'number') {
			ourUrl.searchParams.append('w', String(opts.width));
		}

		if (typeof opts.height === 'number') {
			ourUrl.searchParams.append('h', String(opts.height));
		}
	}

	return ourUrl;
};
