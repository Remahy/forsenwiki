import { COMMAND_PRIORITY_EDITOR, createCommand } from 'lexical';
import { defineExtension } from '@lexical/extension';
import {
	$insertNodeToNearestRoot,
	$unwrapAndFilterDescendants,
	mergeRegister,
} from '@lexical/utils';

import { $isImageNode } from '../Image/Image';
import { $isVideoEmbedNode } from '../VideoEmbed/VideoEmbed';
import { $createGalleryNode, GalleryNode } from './Gallery';

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
			)
		),
});
