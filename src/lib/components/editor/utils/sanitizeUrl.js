// from svelte-lexical

const SUPPORTED_URL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'sms:', 'tel:']);

/**
 * @param {string} url
 */
export function sanitizeUrl(url = '') {
	try {
		const parsedUrl = new URL(url);

		if (!SUPPORTED_URL_PROTOCOLS.has(parsedUrl.protocol)) {
			return 'about:blank';
		}
	} catch {
		return url;
	}
	return url;
}
