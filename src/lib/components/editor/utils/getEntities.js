// @ts-nocheck Lexical's types... Klassiker
import { $nodesOfType } from 'lexical';

import { ALinkNode, HeadingNode } from '$lib/lexical';

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

/**
 * @param {LexicalEditor} editor
 * @throws {string}
 */
export const getArticleTitle = async (editor) => {
	return new Promise((resolve, reject) => {
		editor.update(() => {
			const headings = $nodesOfType(HeadingNode);
			if (!headings.length) return reject('No headings');

			const headingOnes = headings.filter((heading) => heading.getTag() === 'h1');
			if (!headingOnes.length) return reject('No heading 1');

			const titleContent = headingOnes[0].getTextContent();
			if (!titleContent.length) return reject('First heading 1 is empty');

			resolve(titleContent)
		});
	});
};
