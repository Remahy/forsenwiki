import { error } from '@sveltejs/kit';

/**
 * Internal links to articles that no longer exist.
 * The editor sends `missingArticleIds` back when submitting again, to save anyway.
 * @param {{ ids: string[], links: number, blockIds: string[] }} missing
 */
export const MissingArticleLinksError = ({ ids, links, blockIds }) => {
	error(409, {
		message:
			links === 1
				? 'A link points to an article that no longer exists. Remove it or link it to another article, or submit again to save anyway.'
				: `${links} links point to articles that no longer exist. Remove them or link them to other articles, or submit again to save anyway.`,
		blockIds,
		blockLabel: 'link',
		missingArticleIds: ids,
	});
};
