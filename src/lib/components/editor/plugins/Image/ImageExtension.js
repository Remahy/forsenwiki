// Based on umaranis' svelte-lexical
import './EditorImage.css';

import {
	$createParagraphNode,
	$getNodeByKey,
	$getNodeFromDOMNode,
	$getSelection,
	$insertNodes,
	$isNodeSelection,
	$isRangeSelection,
	$isRootOrShadowRoot,
	COMMAND_PRIORITY_EDITOR,
	createCommand,
} from 'lexical';
import { defineExtension } from '@lexical/extension';
import { $insertNodeToNearestRoot, $wrapNodeInElement, mergeRegister } from '@lexical/utils';

import { modal } from '$lib/stores/modal';
import { IMAGE_MIN_HEIGHT, IMAGE_MIN_WIDTH } from '$lib/constants/image';
import { saveContent } from '$lib/utils/indexedDb/content';
import { $isGalleryNode } from '$lib/lexical/custom';

import EditImageModal from '../../toolbar/Image/EditImageModal.svelte';
import { handleNewImage } from '../../utils/handleNewImage';
import { restoreEditorFocus } from '../../utils/focusEditor';
import { migrateWSRVImageUsingElement } from '../../migrations/migrateWSRVImages';
import { $createImageNode, $isImageNode, ImageNode } from './Image';

/**
 * @typedef {import('./Image').ImagePayload} ImagePayload
 * @typedef {Readonly<ImagePayload>} InsertImagePayload
 * @typedef {{ articleId: string }} ImageConfig
 */

/** @type {import('lexical').LexicalCommand<InsertImagePayload>} */
export const INSERT_IMAGE_COMMAND = createCommand();

/**
 * @param {LexicalEditor} editor
 * @param {string} articleId
 * @param {HTMLElement} element
 */
const saveImageAsBlob = async (editor, articleId, element) => {
	try {
		const img = editor.read(() => {
			const node = $getNodeFromDOMNode(element);

			if ($isImageNode(node)) {
				return node;
			}
			return null;
		});

		const src = img?.getSrc();

		if (!img || !src) {
			return;
		}

		// Fetch the image as a Blob
		const response = await fetch(src, {});
		const lastModified = new Date(response.headers.get('Last-Modified') || Date.now()).getTime();
		const etag = response.headers.get('Etag');
		const contentType = response.headers.get('Content-Type') || '';

		let name = src.split('/').pop()?.split('?')?.shift() || etag || 'pasted-image';

		if (name.length > 80) {
			name = name.substring(0, 80);
		}

		const blob = await response.blob();

		const file = new File([blob], name, {
			lastModified,
			type: contentType,
		});

		const imageData = await handleNewImage(file);

		if (imageData?.file) {
			await saveContent(articleId, imageData.hash, imageData.file);
		}

		if (imageData) {
			return editor.update(
				() => {
					const node = $getNodeFromDOMNode(element);

					if ($isImageNode(node)) {
						node.setSrc(imageData.hash);
					}
				},
				{ tag: 'history-merge' }
			);
		}

		console.log(imageData);
		throw new Error('Could not download image!');
	} catch (err) {
		console.error('Error turning image into blob', err);
		editor.update(
			() => {
				const node = $getNodeFromDOMNode(element);

				if ($isImageNode(node)) {
					node.remove();
				}
			},
			{ tag: 'history-merge' }
		);
	}
};

/**
 * @param {LexicalEditor} editor
 * @param {ImagePayload} payload
 */
const openInsertImageModal = (editor, payload) => {
	const placeholderNode = $createImageNode(payload);

	const { width: placeholderNodeWidth, height: placeholderNodeHeight } =
		placeholderNode.getWidthAndHeight();

	modal.set({
		isOpen: true,
		component: EditImageModal,
		src: placeholderNode.getSrc(),
		altText: placeholderNode.getAltText(),
		width: placeholderNodeWidth,
		height: placeholderNodeHeight,
		onClose: () => restoreEditorFocus(editor),
		/** @param {ImagePayload} data */
		onSubmit: (data) => {
			editor.update(() => {
				const node = $createImageNode(payload);

				const { width, height, altText, src } = data;

				if (typeof width === 'number') {
					node.setWidthAndHeight({
						width: width > IMAGE_MIN_WIDTH ? width : 'inherit',
						height: node.getWidthAndHeight().height,
					});
				}

				if (typeof height === 'number') {
					node.setWidthAndHeight({
						width: node.getWidthAndHeight().width,
						height: height > IMAGE_MIN_HEIGHT ? height : 'inherit',
					});
				}

				if (altText?.length) {
					node.setAltText(altText);
				}

				if (src) {
					node.setSrc(src);
				}

				const selection = $getSelection();

				if ($isNodeSelection(selection)) {
					const [selectedNode] = selection.getNodes();
					if ($isGalleryNode(selectedNode)) {
						selectedNode.append(node);
						return;
					}
				}

				if ($isRangeSelection(selection)) {
					$insertNodes([node]);
				} else {
					$insertNodeToNearestRoot(node);
				}

				if ($isRootOrShadowRoot(node.getParent())) {
					$wrapNodeInElement(node, $createParagraphNode).selectEnd();
				}
			});
		},
	});
};

export const ImageExtension = defineExtension({
	name: 'article/image',
	config: /** @type {ImageConfig} */ ({ articleId: '' }),
	register: (editor, { articleId }) =>
		mergeRegister(
			editor.registerMutationListener(ImageNode, (mutatedNodes) => {
				const mutatedImages = editor.read(() => {
					/** @type {Array<Promise<void>>} */
					const promises = [];

					for (const [key, mutation] of mutatedNodes) {
						if (mutation === 'destroyed') {
							continue;
						}

						const node = /** @type {ImageNode | null} */ ($getNodeByKey(key));
						if (!node) {
							console.warn('Could not find mutated image node by key', key, 'that was', mutation);
							continue;
						}

						const src = node.getSrc();

						if (!src) {
							console.warn('ImageExtension: src is undefined');
							continue;
						}

						if (!src.startsWith('https://') && !src.startsWith('data:')) {
							continue;
						}

						const element = /** @type {HTMLImageElement | null} */ (editor.getElementByKey(key));

						if (!element) {
							console.warn(
								'Could not find mutated image node DOM node by key',
								key,
								'that was',
								mutation
							);
							continue;
						}

						if (src?.startsWith('https://wsrv.nl/?url=https%3A%2F%2Fforsen.wiki')) {
							promises.push(migrateWSRVImageUsingElement(editor, element));
							continue;
						}

						// Download image, turn it into a blob.
						promises.push(saveImageAsBlob(editor, articleId, element));
					}

					return promises;
				});

				Promise.allSettled(mutatedImages);
			}),

			editor.registerCommand(
				INSERT_IMAGE_COMMAND,
				(payload) => {
					openInsertImageModal(editor, payload);

					return true;
				},
				COMMAND_PRIORITY_EDITOR
			)
		),
});
