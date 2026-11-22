import { WIKI_PATH } from '$lib/constants/constants';

/**
 * @param {import('lexical').SerializedEditorState} json
 * @param {Record<string, string>} titles
 */
export const relinkInternal = (json, titles) => {
	/** @param {any} node */
	const visit = (node) => {
		const title = node.type === 'a-link' && node.isInternal && titles[node.internalId];

		if (title) {
			const hashAt = node.url.indexOf('#');

			node.url = `${WIKI_PATH}${title}${hashAt === -1 ? '' : node.url.slice(hashAt)}`;
		}

		node.children?.forEach(visit);
	};

	visit(json.root);

	return json;
};
