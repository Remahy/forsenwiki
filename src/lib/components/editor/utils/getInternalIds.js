import { $nodesOfType } from 'lexical';

import { ALinkNode } from '$lib/lexical/custom';

/** @param {ALinkNode[]} links */
export const getOnlyInternalLinks = (links) => links.filter((node) => node.getIsInternal());

/** @param {ALinkNode[]} links */
export const getUniqueInternalIds = (links) =>
	/** @type {string[]} */ ([...new Set(links.map((node) => node.getInternalId()).filter(Boolean))]);

/**
 * @param {LexicalEditor} editor
 * @returns {string[]}
 */
export const getInternalIds = (editor) => {
	return editor.read(() => {
		const links = $nodesOfType(ALinkNode);

		const internalLinks = getOnlyInternalLinks(links);

		const internalIds = getUniqueInternalIds(internalLinks);

		return internalIds;
	});
};
