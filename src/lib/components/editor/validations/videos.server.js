import { $nodesOfType as nodesOfType, $createParagraphNode as createParagraphNode } from 'lexical';

import { VideoEmbedNode } from '$lib/lexical/custom';

/**
 * @param {LexicalEditor} editor
 * @throws {string}
 */
export const adjustVideoEmbedNodeSiblings = (editor) => {
	return new Promise((resolve) => {
		editor.update(
			async () => {
				const videoEmbeds = nodesOfType(VideoEmbedNode);
				if (!videoEmbeds.length) {
					return resolve(null);
				}

				for (let index = 0; index < videoEmbeds.length; index++) {
					const node = videoEmbeds[index];

					const prevNode = node.getPreviousSibling();
					if (!prevNode) {
						const p = createParagraphNode();
						node.insertBefore(p);
					}

					const nextNode = node.getNextSibling();
					if (!nextNode) {
						const p = createParagraphNode();
						node.insertAfter(p, false);
					}
				}

				resolve(null);
			},
			{ discrete: true }
		);
	});
};
