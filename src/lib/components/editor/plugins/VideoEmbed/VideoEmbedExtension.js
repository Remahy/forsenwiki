import '../Image/EditorImage.css';

import {
	$getNodeByKey,
	$getSelection,
	$insertNodes,
	$isNodeSelection,
	COMMAND_PRIORITY_EDITOR,
	createCommand,
	mergeRegister,
} from 'lexical';
import { defineExtension } from '@lexical/extension';

import { getYouTubeClipURL } from '$lib/api/utils';
import { $isGalleryNode } from '$lib/lexical/custom';
import { $createVideoEmbedNode, VideoEmbedNode } from './VideoEmbed';

/**
 * @typedef {Readonly<import('./VideoEmbed').VideoEmbedPayload>} InsertVideoEmbedPayload
 */

/** @type {import('lexical').LexicalCommand<InsertVideoEmbedPayload>} */
export const INSERT_VIDEOEMBED_COMMAND = createCommand();

/**
 * @param {LexicalEditor} editor
 * @param {VideoEmbedNode} node
 */
const fixYouTubeClipURL = async (editor, node) => {
	const url = node.getSrc() || '';

	let res;

	try {
		const req = await getYouTubeClipURL(url);

		if (req.status === 200) {
			res = await req.json();
		}
	} catch {
		// noop
	}

	if (res === url) {
		return;
	}

	if (typeof res === 'string') {
		editor.update(() => {
			node.setSrc(res);
		});
	}
};

/**
 * @param {LexicalEditor} editor
 * @param {InsertVideoEmbedPayload} payload
 */
const insertVideoEmbed = (editor, payload) => {
	editor.update(() => {
		const node = $createVideoEmbedNode(payload);

		const selection = $getSelection();

		if ($isNodeSelection(selection)) {
			const [selectedNode] = selection.getNodes();
			if ($isGalleryNode(selectedNode)) {
				selectedNode.append(node);
				return;
			}
		}

		if (!selection?.isCollapsed()) {
			return;
		}

		$insertNodes([node]);

		if (!node.getParent()) {
			node.remove();
		}
	});
};

export const VideoEmbedExtension = defineExtension({
	name: 'article/video-embed',
	register: (editor) =>
		mergeRegister(
			editor.registerMutationListener(VideoEmbedNode, (mutatedNodes) => {
				editor.update(() => {
					for (const [key, mutation] of mutatedNodes) {
						if (mutation === 'destroyed') {
							continue;
						}

						const node = /** @type {VideoEmbedNode | null} */ ($getNodeByKey(key));
						if (!node) {
							console.warn(
								'Could not find mutated VideoEmbedNode node by key',
								key,
								'that was',
								mutation
							);
							continue;
						}

						if (node.getPlatform() === 'youtube' && node.getSrc()?.includes('youtube.com/clip/')) {
							fixYouTubeClipURL(editor, node);
						}
					}
				});
			}),
			editor.registerCommand(
				INSERT_VIDEOEMBED_COMMAND,
				(payload) => {
					insertVideoEmbed(editor, payload);
					return true;
				},
				COMMAND_PRIORITY_EDITOR
			)
		),
});
