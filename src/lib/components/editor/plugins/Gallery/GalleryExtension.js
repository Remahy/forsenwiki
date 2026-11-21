import {
	$createNodeSelection,
	$getNearestNodeFromDOMNode,
	$setSelection,
	CLICK_COMMAND,
	COMMAND_PRIORITY_EDITOR,
	COMMAND_PRIORITY_LOW,
	createCommand,
} from 'lexical';
import { defineExtension } from '@lexical/extension';
import {
	$insertNodeToNearestRoot,
	$unwrapAndFilterDescendants,
	mergeRegister,
} from '@lexical/utils';

import { $isImageNode } from '../Image/Image';
import { $isVideoEmbedNode } from '../VideoEmbed/VideoEmbed';
import { $createGalleryNode, $isGalleryNode, GalleryNode } from './Gallery';

/**
 * @typedef {Readonly<import('./Gallery').GalleryNodePayload>} GalleryNodePayload
 */

/** @type {import('lexical').LexicalCommand<GalleryNodePayload>} */
export const INSERT_GALLERY_COMMAND = createCommand();

const allowedChildren = [$isImageNode, $isVideoEmbedNode];

/**
 * @param {LexicalEditor} editor
 * @param {GalleryNodePayload} payload
 */
const insertGallery = (editor, { float, width, height, hasBorder }) => {
	editor.update(() => {
		$insertNodeToNearestRoot($createGalleryNode({ float, width, height, hasBorder }));
	});
};

/** @param {MouseEvent} event */
const $selectGalleryFromHandle = (event) => {
	const { target } = event;

	if (!(target instanceof Element) || !target.closest('.editor-gallery__handle')) {
		return false;
	}

	const node = $getNearestNodeFromDOMNode(target);

	if (!$isGalleryNode(node)) {
		return false;
	}

	const selection = $createNodeSelection();
	selection.add(node.getKey());
	$setSelection(selection);

	return true;
};

export const GalleryExtension = defineExtension({
	name: 'article/gallery',
	register: (editor) =>
		mergeRegister(
			editor.registerNodeTransform(GalleryNode, (node) => {
				$unwrapAndFilterDescendants(node, (n) => !!allowedChildren.find((fn) => fn(n)));
			}),
			editor.registerCommand(
				INSERT_GALLERY_COMMAND,
				(payload) => {
					insertGallery(editor, payload);
					return true;
				},
				COMMAND_PRIORITY_EDITOR
			),
			editor.registerCommand(CLICK_COMMAND, $selectGalleryFromHandle, COMMAND_PRIORITY_LOW)
		),
});
