/**
 * @typedef {Readonly<import('./VideoEmbed').VideoEmbedPayload>} InsertVideoEmbedPayload
 */

/** @type {import('lexical').LexicalCommand<InsertVideoEmbedPayload>} */
export const INSERT_VIDEOEMBED_COMMAND = createCommand();

// Based on umaranis' svelte-lexical

import '../Image/EditorImage.css';

import {
	$insertNodes as insertNodes,
	createCommand,
	COMMAND_PRIORITY_EDITOR,
	$getNodeByKey as getNodeByKey,
	$getSelection as getSelection,
	mergeRegister,
} from 'lexical';

import { getYouTubeClipURL } from '$lib/api/utils';
import {
	$isVideoEmbedNode as isVideoEmbedNode,
	$createVideoEmbedNode as createVideoEmbedNode,
	VideoEmbedNode,
} from './VideoEmbed';
import { editorGlobals } from '../../editorGlobals.svelte';

let editor = editorGlobals.editor;

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

/** @param {import('./VideoEmbed').VideoEmbedPayload} payload */
const wrapperInsertVideoEmbed = (payload) => {
	editor.update(() => {
		const node = createVideoEmbedNode(payload);

		const selection = getSelection();
		if (!selection?.isCollapsed()) {
			return;
		}

		insertNodes([node]);

		const parent = /** @type {import('lexical').RootNode} */ node.getParent();

		if (!parent) {
			node.remove();
			return;
		}
	});
};

export const registerVideoEmbedPlugin = () => {
	if (!editor.hasNodes([VideoEmbedNode])) {
		throw new Error('VideoEmbedPlugin: VideoEmbedNode not registered on editor');
	}

	return mergeRegister(
		editor.registerMutationListener(VideoEmbedNode, (mutatedNodes) => {
			editor.update(() => {
				for (const [key, mutation] of mutatedNodes) {
					if (mutation === 'destroyed') {
						continue;
					}

					const node = getNodeByKey(key);
					if (!node) {
						console.warn(
							'Could not find mutated VideoEmbedNode node by key',
							key,
							'that was',
							mutation
						);
						continue;
					}

					if (!isVideoEmbedNode(node)) {
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
				wrapperInsertVideoEmbed(payload);
				return true;
			},
			COMMAND_PRIORITY_EDITOR
		)
	);
};
