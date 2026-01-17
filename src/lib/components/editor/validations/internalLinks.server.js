import { WIKI_PATH } from '$lib/constants/constants';
import { $nodesOfType as nodesOfType } from 'lexical';
import { _getYPostsByIds } from '../../../../routes/api/article/read/[title]/+server';
import { getInternalIds, getOnlyInternalLinks } from '../utils/getInternalIds';
import { ALinkNode } from '$lib/lexical/custom';

/**
 * @param {LexicalEditor} editor
 * @throws {string}
 */
export const adjustInternalLinks = async (editor) => {
	const internalIds = getInternalIds(editor);
	if (!internalIds.length) {
		return null;
	}

	const posts = await _getYPostsByIds(internalIds);

	if (!posts.length) {
		return null;
	}

	return new Promise((resolve) => {
		editor.update(
			() => {
				const links = nodesOfType(ALinkNode);
				const internalLinks = getOnlyInternalLinks(links);

				for (let index = 0; index < internalIds.length; index += 1) {
					const internalId = internalIds[index];
					const relevantLinks = internalLinks.filter((link) => link.getInternalId() === internalId);
					const relevantPost = posts.find((post) => post.id === internalId);

					if (!relevantPost) {
						continue;
					}

					for (let ii = 0; ii < relevantLinks.length; ii++) {
						const link = relevantLinks[ii];
						// Hardcoded /w/ for now, needs to eventually support /content/
						const newURL = `${WIKI_PATH}${relevantPost?.title}`;

						if (link.getURL() === newURL) {
							continue;
						}

						link.setURL(newURL);
					}
				}
			},
			{ discrete: true }
		);

		resolve(null);
	});
};
