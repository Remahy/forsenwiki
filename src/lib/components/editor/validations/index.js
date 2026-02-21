import { $nodesOfType } from 'lexical';

import { ParagraphNode } from '$lib/lexical/index';
import { ALinkNode } from '$lib/lexical/custom';

import { getOnlyInternalLinks } from '../utils/getInternalIds';

/**
 * @param {LexicalEditor} editor
 * @throws {string}
 */
export const validateArticle = (editor) => {
	return editor.read(() => {
		const paragraphs = $nodesOfType(ParagraphNode);
		if (!paragraphs.length) {
			throw new Error('No paragraphs');
		}

		const links = $nodesOfType(ALinkNode) || [];
		const internalLinks = getOnlyInternalLinks(links);
		const internalLinkURLs = internalLinks.map((node) => node.getURL());
		if (internalLinkURLs.length && internalLinkURLs.some((url) => !url.startsWith('/'))) {
			throw new Error('An internal link was malformed');
		}
	});
};
