import { $nodesOfType as nodesOfType, $createParagraphNode as createParagraphNode } from 'lexical';

import { VideoEmbedNode } from '$lib/lexical/custom';
import { VIDEO_MIN_HEIGHT, VIDEO_MAX_HEIGHT, VIDEO_MIN_WIDTH } from '$lib/constants/video';

/**
 * @param {LexicalEditor} editor
 * @throws {string}
 */
export const adjustVideoEmbedNodeSiblings = (editor) => {
	return new Promise((resolve) => {
		editor.update(
			() => {
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

					let { width, height } = node.getWidthAndHeight();

					width = typeof width === 'number' ? Math.max(VIDEO_MIN_WIDTH, Math.round(width)) : width;
					height =
						typeof height === 'number'
							? Math.min(Math.max(VIDEO_MIN_HEIGHT, Math.round(height)), VIDEO_MAX_HEIGHT)
							: height;

					node.setWidthAndHeight({
						width,
						height,
					});
				}
			},
			{ discrete: true }
		);

		resolve(null);
	});
};
