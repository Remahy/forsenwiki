// @ts-nocheck Lexical's types... Klassiker
import { ParagraphNode, $nodesOfType } from 'lexical';
import { HeadingNode } from '@lexical/rich-text';

import { ALinkNode } from '../plugins/ALink';
import { getOnlyInternalLinks } from '../utils/getEntities';

/**
 * @param {LexicalEditor} editor
 * @throws {string}
 */
export const validateArticle = (editor) => {
	return new Promise((resolve, reject) => {
		editor.update(() => {
			const paragraphs = $nodesOfType(ParagraphNode);
			if (!paragraphs.length) return reject('No paragraphs');

			/** @type {HeadingNode[]} */
			const headings = $nodesOfType(HeadingNode);
			if (!headings.length) return reject('No headings');

			const headingOnes = headings.filter((heading) => heading.getTag() === 'h1');
			if (!headingOnes.length) return reject('No heading 1');

			const title = headingOnes[0].getTextContent();
			if (!title.length) return reject('First heading 1 is empty');

			const links = $nodesOfType(ALinkNode) || [];
			const internalLinks = getOnlyInternalLinks(links);
			const internalLinkURLs = internalLinks.map((node) => node.getURL());
			if (internalLinkURLs.length && internalLinkURLs.some((url) => !url.startsWith('/'))) {
				return reject('An internal link was malformed');
			}

			resolve(true)
		});
	});
}
