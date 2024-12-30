<script context="module">
	/**
	 * @typedef {Readonly<import('./Image').ImagePayload>} InsertImagePayload
	 */

	/** @type {import('lexical').LexicalCommand<InsertImagePayload>} */
	export const INSERT_IMAGE_COMMAND = createCommand();

	/** @type {(targetWindow: Window | null) => Selection | null} */
	const getDOMSelection = (targetWindow) =>
		CAN_USE_DOM ? (targetWindow || window).getSelection() : null;
</script>

<script>
	// Based on umaranis' svelte-lexical
	import './Image.css';

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
	} from 'lexical';
	import { $wrapNodeInElement as wrapNodeInElement, mergeRegister } from '@lexical/utils';
	import { onMount } from 'svelte';
	import { getEditor } from 'svelte-lexical';

	import { CAN_USE_DOM } from '$lib/environment/utils';
	import { cacheServiceBaseURLWithStatic } from '$lib/utils/getCacheURL';
	import { modal } from '$lib/stores/modal';
	import EditImageModal from '../../toolbar/ImageButtons/EditImageModal.svelte';
	import {
		$createImageNode as createImageNode,
		$isImageNode as isImageNode,
		ImageNode,
		TRANSPARENT_IMAGE,
	} from './Image';

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
		const target = /** @type {null | Element | Document} */ (event.target);
		const targetWindow =
			target == null
				? null
				: target.nodeType === 9
					? /** @type {Document} */ (target).defaultView
					: /** @type {Element} */ (target).ownerDocument.defaultView;
		const domSelection = getDOMSelection(targetWindow);
		if (document.caretRangeFromPoint) {
			range = document.caretRangeFromPoint(event.clientX, event.clientY);
		} else if (event.rangeParent && domSelection !== null) {
			domSelection.collapse(event.rangeParent, event.rangeOffset || 0);
			range = domSelection.getRangeAt(0);
		} else {
			throw Error(`Cannot get the selection when dragging`);
		}

		return range;
	}

	/**
	 * @param {{ src: string }} img
	 * @param {import('./Image').ImageNode} node
	 */
	function getBase64Image(img, node) {
		return async () => {
			try {
				// Fetch the image as a Blob
				const response = await fetch(img.src);
				const blob = await response.blob();

				/** @type {string} */
				const base64 = await new Promise((resolve, reject) => {
					try {
						const reader = new FileReader();
						reader.onloadend = () => {
							// Base64 string with MIME type
							const result = reader.result;

							if (typeof result !== 'string') {
								reject(new Error('FileReader onloadend did not return a string.'));
								return;
							}

							resolve(result);
						};

						reader.onerror = (_) => {
							throw reader.error;
						};

						reader.readAsDataURL(blob);
					} catch (error) {
						reject(error);
					}
				});

				editor.update(() => node.setSrc(base64), { tag: 'history-merge' });
			} catch (error) {
				console.error('Error turning image into base64', error);
				editor.update(() => node.setSrc(TRANSPARENT_IMAGE), { tag: 'history-merge' });
			}
		};
	}

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
						width >= 28 &&
						height >= 28
					) {
						node.setWidthAndHeight({ width, height });
					}

					if (altText.length) {
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
			throw new Error('ImagesPlugin: ImageNode not registered on editor');
		}

		img = document.createElement('img');
		img.src = TRANSPARENT_IMAGE;

		return mergeRegister(
			editor.registerMutationListener(ImageNode, (mutatedNodes) => {
				/** @type {any[]} */
				const promises = [];
				editor.read(async () => {
					for (const [key, mutation] of mutatedNodes) {
						if (mutation === 'destroyed') continue;
						/** @type {ImageNode | null} */
						const node = getNodeByKey(key);
						if (!node) {
							console.warn('Could not find mutated image node by key', key, 'that was', mutation);
							continue;
						}

						const src = node.getSrc();

						if (src.startsWith('data:')) {
							continue;
						}

						if (src.startsWith(cacheServiceBaseURLWithStatic)) {
							continue;
						}

						// Download image, turn it into base64.
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

						promises.push(getBase64Image({ src }, node));
					}

					if (promises.length) {
						Promise.all(promises.map((fn) => fn()));
					}
				});
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

<!--for ImageComponent history plugin -->
<slot />
