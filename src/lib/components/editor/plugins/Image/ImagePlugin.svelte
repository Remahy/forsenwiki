<script module>
	/**
	 * @typedef {Readonly<import('./Image').ImagePayload>} InsertImagePayload
	 */

	/** @type {import('lexical').LexicalCommand<InsertImagePayload>} */
	export const INSERT_IMAGE_COMMAND = createCommand();
</script>

<script>
	// Based on umaranis' svelte-lexical
	import './EditorImage.css';

	import { onMount } from 'svelte';
	import {
		$createParagraphNode as createParagraphNode,
		$createRangeSelection as createRangeSelection,
		$getSelection as getSelection,
		$insertNodes as insertNodes,
		$isNodeSelection as isNodeSelection,
		$isRootOrShadowRoot as isRootOrShadowRoot,
		$setSelection as setSelection,
		$getNodeByKey as getNodeByKey,
		COMMAND_PRIORITY_EDITOR,
		COMMAND_PRIORITY_HIGH,
		COMMAND_PRIORITY_LOW,
		createCommand,
		DRAGOVER_COMMAND,
		DRAGSTART_COMMAND,
		DROP_COMMAND,
		getDOMSelectionFromTarget,
		$getNodeFromDOMNode as getNodeFromDOMNode,
	} from 'lexical';
	import { $wrapNodeInElement as wrapNodeInElement, mergeRegister } from '@lexical/utils';
	import { getEditor } from 'svelte-lexical';

	import { modal } from '$lib/stores/modal';
	import { IMAGE_MIN_HEIGHT, IMAGE_MIN_WIDTH } from '$lib/constants/image';
	import { saveContent } from '$lib/utils/indexedDb/content';

	import EditImageModal from '../../toolbar/ImageButtons/EditImageModal.svelte';
	import { editorGlobals } from '../../editorGlobals.svelte';
	import { handleNewImage } from '../../utils/handleNewImage';
	import {
		$createImageNode as createImageNode,
		$isImageNode as isImageNode,
		ImageNode,
	} from './Image';
	import { migrateWSRVImageUsingElement } from '../../migrations/migrateWSRVImages';

	const id = $derived(editorGlobals.articleId);

	/**
	 * @typedef {Object} Props
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props} */
	let { children } = $props();

	/** @type {import('lexical').LexicalEditor} */
	const editor = getEditor();

	/** @type {HTMLImageElement} */
	let img;

	/**
	 * @param {DragEvent} event
	 * @returns {boolean}
	 */
	function onDragStart(event) {
		const node = getImageNodeInSelection();
		if (!node) {
			return false;
		}
		const dataTransfer = event.dataTransfer;
		if (!dataTransfer) {
			return false;
		}

		const { width, height } = node.getWidthAndHeight();

		dataTransfer.setData('text/plain', '_');
		dataTransfer.setDragImage(img, 0, 0);
		dataTransfer.setData(
			'application/x-lexical-drag',
			JSON.stringify({
				data: {
					altText: node.__altText,
					key: node.getKey(),
					src: node.__src,
					width,
					height,
				},
				type: ImageNode.getType(),
			})
		);

		return true;
	}

	/**
	 * @param {DragEvent} event
	 * @returns {boolean}
	 */
	function onDragover(event) {
		const node = getImageNodeInSelection();
		if (!node) {
			return false;
		}
		if (!canDropImage(event)) {
			event.preventDefault();
		}
		return true;
	}

	/**
	 * @param {DragEvent} event
	 * @param {import('lexical').LexicalEditor} editor
	 * @returns {boolean}
	 */
	function onDrop(event, editor) {
		const node = getImageNodeInSelection();
		if (!node) {
			return false;
		}
		const data = getDragImageData(event);
		if (!data) {
			return false;
		}
		event.preventDefault();
		if (canDropImage(event)) {
			const range = getDragSelection(event);
			node.remove();
			const rangeSelection = createRangeSelection();
			if (range !== null && range !== undefined) {
				rangeSelection.applyDOMRange(range);
			}
			setSelection(rangeSelection);
			editor.dispatchCommand(INSERT_IMAGE_COMMAND, data);
		}
		return true;
	}

	/** @returns {import('./Image').ImageNode | null} */
	function getImageNodeInSelection() {
		const selection = getSelection();
		if (!isNodeSelection(selection)) {
			return null;
		}
		const nodes = selection.getNodes();
		const node = nodes[0];
		return isImageNode(node) ? node : null;
	}

	/**
	 * @param {DragEvent} event
	 * @returns {InsertImagePayload | null}
	 */
	function getDragImageData(event) {
		const dragData = event.dataTransfer?.getData('application/x-lexical-drag');
		if (!dragData) {
			return null;
		}
		const { type, data } = JSON.parse(dragData);
		if (type !== 'image') {
			return null;
		}

		return data;
	}

	/**
	 * @param {DragEvent} event
	 * @returns {boolean}
	 */
	function canDropImage(event) {
		const target = event.target;
		return !!(
			target &&
			target instanceof HTMLElement &&
			!target.closest('code, span.editor-image') &&
			target.parentElement &&
			target.parentElement.closest('div.ContentEditable__root')
		);
	}

	/**
	 * @param {DragEvent} event
	 * @returns {Range | null | undefined}
	 */
	function getDragSelection(event) {
		let range;
		const domSelection = getDOMSelectionFromTarget(event.target);
		if (document.caretRangeFromPoint) {
			range = document.caretRangeFromPoint(event.clientX, event.clientY);
		} else if (event.rangeParent && domSelection !== null) {
			domSelection.collapse(event.rangeParent, event.rangeOffset || 0);
			range = domSelection.getRangeAt(0);
		} else {
			throw new Error('Cannot get the selection when dragging');
		}

		return range;
	}

	/**
	 * @param {HTMLElement} element
	 */
	const saveImageAsBlob = async (element) => {
		try {
			const img = editor.read(() => {
				const node = getNodeFromDOMNode(element);

				if (isImageNode(node)) {
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

			const name = src.split('/').pop() || etag || 'pasted-image';

			const blob = await response.blob();

			const file = new File([blob], name, {
				lastModified,
				type: contentType,
			});

			const imageData = await handleNewImage(file);

			if (imageData?.file) {
				await saveContent(id, imageData.hash, imageData.file);
			}

			if (imageData) {
				return editor.update(
					() => {
						const node = getNodeFromDOMNode(element);

						if (isImageNode(node)) {
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
					const node = getNodeFromDOMNode(element);

					if (isImageNode(node)) {
						node.setSrc('');
					}
				},
				{ tag: 'history-merge' }
			);
		}
	};

	/** @param {import('./Image').ImagePayload} payload */
	function wrapperInsertImage(payload) {
		const placeholderNode = createImageNode(payload);

		const { width: placeholderNodeWidth, height: placeholderNodeHeight } =
			placeholderNode.getWidthAndHeight();

		modal.set({
			component: EditImageModal,
			src: placeholderNode.getSrc(),
			altText: placeholderNode.getAltText(),
			width: placeholderNodeWidth,
			height: placeholderNodeHeight,
			/** @param {import('./Image').ImagePayload} data */
			onSubmit: (data) => {
				editor.update(() => {
					const node = createImageNode(payload);

					const { width, height, altText, src } = data;

					if (
						typeof width === 'number' &&
						typeof height === 'number' &&
						width >= IMAGE_MIN_WIDTH &&
						height >= IMAGE_MIN_HEIGHT
					) {
						node.setWidthAndHeight({ width, height });
					}

					if (altText?.length) {
						node.setAltText(altText);
					}

					if (src) {
						node.setSrc(src);
					}

					insertNodes([node]);
					if (isRootOrShadowRoot(node.getParentOrThrow())) {
						wrapNodeInElement(node, createParagraphNode).selectEnd();
					}
				});
			},
			isOpen: true,
		});
	}

	onMount(() => {
		if (!editor.hasNodes([ImageNode])) {
			throw new Error('ImagePlugin: ImageNode not registered on editor');
		}

		img = document.createElement('img');
		img.src = '';

		return mergeRegister(
			editor.registerMutationListener(ImageNode, (mutatedNodes) => {
				const mutatedImages = editor.read(() => {
					/** @type {Array<Promise<void>>} */
					const promises = [];

					for (const [key, mutation] of mutatedNodes) {
						if (mutation === 'destroyed') {
							continue;
						}

						/** @type {ImageNode | null} */
						const node = getNodeByKey(key);
						if (!node) {
							console.warn('Could not find mutated image node by key', key, 'that was', mutation);
							continue;
						}

						const src = node.getSrc();

						if (!src) {
							console.warn('ImagePlugin: src is undefined');
							continue;
						}

						// fetch() on data should realistically work.
						// if (src?.startsWith('data:')) {
						// 	continue;
						// }
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
						promises.push(saveImageAsBlob(element));
					}

					return promises;
				});

				Promise.allSettled(mutatedImages);
			}),

			editor.registerCommand(
				INSERT_IMAGE_COMMAND,
				(payload) => {
					wrapperInsertImage(payload);

					return true;
				},
				COMMAND_PRIORITY_EDITOR
			),

			editor.registerCommand(
				DRAGSTART_COMMAND,
				(event) => {
					return onDragStart(event);
				},
				COMMAND_PRIORITY_HIGH
			),

			editor.registerCommand(
				DRAGOVER_COMMAND,
				(event) => {
					return onDragover(event);
				},
				COMMAND_PRIORITY_LOW
			),

			editor.registerCommand(
				DROP_COMMAND,
				(event) => {
					return onDrop(event, editor);
				},
				COMMAND_PRIORITY_HIGH
			)
		);
	});
</script>

{@render children?.()}
