import { $nodesOfType } from 'lexical';

import { ParagraphNode } from '$lib/lexical';
import { ALinkNode } from '$lib/lexicalCustom';

import { getOnlyInternalLinks } from '../utils/getEntities';

/**
 * @param {LexicalEditor} editor
 * @throws {string}
 */
export const validateArticle = (editor) => {
	return new Promise((resolve, reject) => {
		editor.update(
			() => {
				const paragraphs = $nodesOfType(ParagraphNode);
				if (!paragraphs.length) {
					return reject('No paragraphs');
				}

				const links = $nodesOfType(ALinkNode) || [];
				const internalLinks = getOnlyInternalLinks(links);
				const internalLinkURLs = internalLinks.map((node) => node.getURL());
				if (internalLinkURLs.length && internalLinkURLs.some((url) => !url.startsWith('/'))) {
					return reject('An internal link was malformed');
				}

				resolve(true);
			},
			{ discrete: true }
		);
	});
};
