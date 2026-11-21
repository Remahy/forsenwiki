import { MISSING_ARTICLE_LINKS_EXPLANATION } from '$lib/constants/activity';

/**
 * @param {{ missingArticles?: string[] }} save `missingArticles`
 */
export const getSystemExplanation = ({ missingArticles = [] }) => {
	if (missingArticles.length) {
		return MISSING_ARTICLE_LINKS_EXPLANATION;
	}

	return undefined;
};
