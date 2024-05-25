import { $nodesOfType } from 'lexical';

import { ALinkNode } from '$lib/lexicalCustom';

/** @param {ALinkNode[]} links */
export const getOnlyInternalLinks = (links) => links.filter((node) => node.getIsInternal());

/**
 * @param {LexicalEditor} editor
 * @returns {Promise<string[]>}
 */
export const getArticleURLIds = (editor) => {
	return new Promise((resolve) => {
		editor.update(() => {
			const links = $nodesOfType(ALinkNode);

			const internalLinks = getOnlyInternalLinks(links);

			const internalLinkURLs = internalLinks.map((node) => node.getURL());

			const ids = internalLinkURLs
				.map((url) => encodeURI(url))
				.map((url) => url.replace(/^\/([\w-]+)\/[\w-]+\/?$/, '$1'))
				// If the same exact URL is included, that means the replace didn't work.
				.filter((url) => !internalLinkURLs.includes(url));

			resolve(ids);
		})
	})
}
