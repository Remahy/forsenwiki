import { $nodesOfType } from 'lexical';

import { ParagraphNode } from '$lib/lexical/index';
import { ALinkNode } from '$lib/lexical/custom';
import { InvalidArticleError } from '$lib/errors/InvalidArticle';

import { getOnlyInternalLinks } from '../utils/getInternalIds';
import { $closestBlockId } from '../utils/closestBlockId';
import { labelBlocks } from '$lib/errors/ErrorBlocks';
import { $sortBlockIds } from '../utils/documentOrder';

/**
 * @param {LexicalEditor} editor
 * @throws {InvalidArticleError}
 */
export const validateArticle = (editor) => {
	return editor.read(() => {
		const paragraphs = $nodesOfType(ParagraphNode);
		if (!paragraphs.length) {
			throw new InvalidArticleError('The article has no paragraphs.');
		}

		const internalLinks = getOnlyInternalLinks($nodesOfType(ALinkNode));
		const malformed = internalLinks.filter((link) => !link.getURL().startsWith('/'));

		if (malformed.length) {
			const blockIds = new Set(malformed.map($closestBlockId).filter((id) => id !== null));

			throw new InvalidArticleError(
				malformed.length === 1
					? 'An internal link is malformed. Link it to the article again.'
					: `${malformed.length} internal links are malformed. Link them to their articles again.`,
				{ blocks: labelBlocks($sortBlockIds([...blockIds]), 'link') }
			);
		}
	});
};
