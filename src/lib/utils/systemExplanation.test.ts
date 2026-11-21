import { expect, test } from 'vitest';

import { MISSING_ARTICLE_LINKS_EXPLANATION } from '$lib/constants/activity';
import { getSystemExplanation } from './systemExplanation';

test('a save keeping links to missing articles is explained, any other save is not', () => {
	expect(getSystemExplanation({ missingArticles: ['deleted'] })).toBe(
		MISSING_ARTICLE_LINKS_EXPLANATION
	);
	expect(getSystemExplanation({ missingArticles: [] })).toBeUndefined();
	expect(getSystemExplanation({})).toBeUndefined();
});
