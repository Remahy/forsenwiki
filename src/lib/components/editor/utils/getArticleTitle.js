import sanitize from 'sanitize-filename';
import isUrl from 'is-url';
import { $nodesOfType } from 'lexical';

import { HeadingNode } from '$lib/lexical';

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

			const rawTitle = headingOnes[0].getTextContent().trim();
			if (!rawTitle.length) return reject('First heading 1 is empty');

			const spaceReplacedTitle = rawTitle.replace(/\s/g, '_');

			const sanitizedTitle = sanitize(spaceReplacedTitle);

			const lowerCaseTitle = sanitizedTitle.toLocaleLowerCase();

			// Extreme replacement, when previous steps fail to produce a valid url.
			if (!isUrl(`http://example.com/${lowerCaseTitle}`)) {
				const onlyASCIITitle = lowerCaseTitle.replace(/\W+/g, '')
				resolve(encodeURIComponent(onlyASCIITitle))
				return;
			}

			resolve(encodeURIComponent(lowerCaseTitle))
		});
	});
};
