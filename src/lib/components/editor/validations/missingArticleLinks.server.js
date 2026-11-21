import { readMissingYPostIds } from '$lib/db/post/read';
import { MissingArticleLinksError } from '$lib/errors/MissingArticleLinks';
import { getInternalLinkTargets } from '../utils/getInternalLinkTargets';

/**
 * Refuses internal links to articles that no longer exist, such as ones deleted from the database,
 * unless the writer was shown them and submitted again.
 * @param {LexicalEditor} editor
 * @param {unknown} allowed The article ids the writer chose to keep links to.
 */
export const checkMissingArticleLinks = async (editor, allowed) => {
	const targets = getInternalLinkTargets(editor);

	if (!targets.size) {
		return;
	}

	const missing = await readMissingYPostIds([...targets.keys()]);
	const acknowledged = Array.isArray(allowed) ? allowed : [];

	if (missing.every((id) => acknowledged.includes(id))) {
		return;
	}

	const gone = missing.map(
		(id) => /** @type {{ links: number, blockIds: Set<string> }} */ (targets.get(id))
	);

	MissingArticleLinksError({
		ids: missing,
		links: gone.reduce((sum, { links }) => sum + links, 0),
		blockIds: [...new Set(gone.flatMap(({ blockIds }) => [...blockIds]))],
	});
};
