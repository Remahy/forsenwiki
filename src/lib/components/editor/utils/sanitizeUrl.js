import { LinkNode } from '$lib/lexical/index';

/**
 * `sanitizeUrl` is only exposed as a `LinkNode` method, but doesn't use `this`,
 * so calling it from the prototype doesn't require an active editor.
 *
 * @param {string} url
 */
export function sanitizeUrl(url = '') {
	return LinkNode.prototype.sanitizeUrl(url);
}
