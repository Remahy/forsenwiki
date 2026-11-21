import { $nodesOfType as nodesOfType } from 'lexical';
import { ALinkNode, ImageNode, VideoEmbedNode } from '$lib/lexical/custom';
import { DOMAIN, STATIC_DOMAIN } from '$lib/environment/environment';
import { classifyLink } from '$lib/utils/externalLink';
import { isUploadHash } from '$lib/utils/sha256';

/**
 * Uploads (images, uploaded videos, their subtitles, links to uploads) by hash, and external links.
 * @param {LexicalEditor} editor
 */
export const getContentReferences = (editor) => {
	return editor.read(() => {
		/** @type {Set<string>} */
		const hashes = new Set();
		/** @type {Set<string>} */
		const links = new Set();

		/** @param {string | undefined} src */
		const add = (src) => {
			// Sources may still be full static URLs.
			const hash = src?.split('/').pop();

			if (isUploadHash(hash)) {
				hashes.add(/** @type {string} */ (hash));
			}
		};

		for (const image of nodesOfType(ImageNode)) {
			add(image.getSrc());
		}

		for (const video of nodesOfType(VideoEmbedNode)) {
			if (video.getPlatform() === 'usercontent') {
				add(video.getSrc());
			}

			for (const subtitle of video.getSubtitles() ?? []) {
				add(subtitle.src);
			}
		}

		for (const link of nodesOfType(ALinkNode)) {
			if (link.getIsInternal()) {
				continue;
			}

			const target = classifyLink(link.getURL(), { domain: DOMAIN, staticDomain: STATIC_DOMAIN });

			if (target && 'hash' in target) {
				add(target.hash);
			} else if (target) {
				links.add(target.url);
			}
		}

		return { hashes: [...hashes], links: [...links] };
	});
};
