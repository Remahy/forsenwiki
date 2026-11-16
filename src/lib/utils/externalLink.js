export const LINK_CONTENT_TYPE = 'link';

/** Upload hashes are bare hex, so a link's hash can never be one. */
export const LINK_HASH_PREFIX = 'link:';

/**
 * Used to normalize the link to VITE_DOMAIN.
 * @param {string} domain
 */
export const wikiLinkOf = (domain) => new URL(domain).href;

/**
 * @param {string} href
 * @param {{ domain?: string, staticDomain?: string }} origins
 * @returns {{ url: string } | { hash: string } | null} `hash` when it links an upload.
 */
export const classifyLink = (href, { domain, staticDomain }) => {
	let url;
	try {
		url = new URL(href);
	} catch {
		return null;
	}

	if (url.protocol !== 'http:' && url.protocol !== 'https:') {
		return null;
	}

	if (staticDomain && url.origin === new URL(staticDomain).origin) {
		const hash = url.pathname.split('/').pop();

		return hash ? { hash } : null;
	}

	if (domain && url.origin === new URL(domain).origin) {
		return null;
	}

	return { url: url.href };
};
