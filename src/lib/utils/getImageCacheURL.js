import { IMAGE_MAX_WIDTH, IMAGE_MAX_HEIGHT } from '$lib/constants/image';
import { STATIC_DOMAIN } from '$lib/environment/environment';

export const cacheServiceBaseURLWithStatic = STATIC_DOMAIN;

/**
 * @param {string} hash
 * @param {{ width?: 'inherit' | number, height?: 'inherit' | number }} [opts]
 */
export const getImageCacheURL = (hash, opts) => {
	// This is the Cloudflare Images endpoint. Hardcoded for now.
	// https://developers.cloudflare.com/images/transform-images/transform-via-url/
	const ourUrl = new URL('', STATIC_DOMAIN + '/cdn-cgi/image/');

	if (opts) {
		const newOpts = [];
		if (typeof opts.width === 'number' && opts.width < IMAGE_MAX_WIDTH) {
			newOpts.push(`width=${opts.width}`);
		}

		if (typeof opts.height === 'number' && opts.height < IMAGE_MAX_HEIGHT) {
			newOpts.push(`height=${opts.height}`);
		}

		for (let index = 0; index < newOpts.length; index++) {
			const opt = newOpts[index];
			const isNotLast = index !== newOpts.length - 1;

			ourUrl.pathname += `${opt}${isNotLast ? ',' : ''}`;
		}
	}

	ourUrl.pathname += `/${hash}`;

	return ourUrl;
};
