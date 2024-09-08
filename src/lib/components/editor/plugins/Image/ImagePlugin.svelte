<script context="module" lang="ts">
	export const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> = createCommand();
	export type InsertImagePayload = Readonly<ImagePayload>;

	const getDOMSelection = (targetWindow: Window | null): Selection | null =>
		CAN_USE_DOM ? (targetWindow || window).getSelection() : null;
</script>

<script lang="ts">
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
		type LexicalCommand,
		type LexicalEditor,
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
		type ImagePayload,
	} from './Image';

	const editor: LexicalEditor = getEditor();

	let img: HTMLImageElement;

	function onDragStart(event: DragEvent): boolean {
		const node = getImageNodeInSelection();
		if (!node) {
			return false;
		}
		const dataTransfer = event.dataTransfer;
		if (!dataTransfer) {
			return false;
		}
		dataTransfer.setData('text/plain', '_');
		dataTransfer.setDragImage(img, 0, 0);
		dataTransfer.setData(
			'application/x-lexical-drag',
			JSON.stringify({
				data: {
					altText: node.__altText,
					height: node.__height,
					key: node.getKey(),
					src: node.__src,
					width: node.__width,
				},
				type: ImageNode.getType(),
			})
		);

		return true;
	}

	function onDragover(event: DragEvent): boolean {
		const node = getImageNodeInSelection();
		if (!node) {
			return false;
		}
		if (!canDropImage(event)) {
			event.preventDefault();
		}
		return true;
	}

	function onDrop(event: DragEvent, editor: LexicalEditor): boolean {
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

	function getImageNodeInSelection(): ImageNode | null {
		const selection = getSelection();
		if (!isNodeSelection(selection)) {
			return null;
		}
		const nodes = selection.getNodes();
		const node = nodes[0];
		return isImageNode(node) ? node : null;
	}

	function getDragImageData(event: DragEvent): null | InsertImagePayload {
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

	function canDropImage(event: DragEvent): boolean {
		const target = event.target;
		return !!(
			target &&
			target instanceof HTMLElement &&
			!target.closest('code, span.editor-image') &&
			target.parentElement &&
			target.parentElement.closest('div.ContentEditable__root')
		);
	}

	function getDragSelection(event: DragEvent): Range | null | undefined {
		let range;
		const target = event.target as null | Element | Document;
		const targetWindow =
			target == null
				? null
				: target.nodeType === 9
					? (target as Document).defaultView
					: (target as Element).ownerDocument.defaultView;
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

	function getBase64Image(img: { src: string }, node: ImageNode) {
		return async () => {
			try {
				// Fetch the image as a Blob
				const response = await fetch(img.src);
				const blob = await response.blob();

				const base64 = await new Promise<string>((resolve, reject) => {
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

	function wrapperInsertImage(payload: ImagePayload) {
		const placeholderNode = createImageNode(payload);

		modal.set({
			component: EditImageModal,
			src: placeholderNode.getSrc(),
			altText: placeholderNode.getAltText(),
			width: placeholderNode.__width,
			height: placeholderNode.__height,
			onSubmit: (data: ImagePayload) => {
				editor.update(() => {
					const node = createImageNode(payload);

					const { width, height, altText, src } = data;

					if (
						typeof width === 'number' &&
						typeof height === 'number' &&
						width >= 28 &&
						height >= 28
					) {
						node.setWidthAndHeight(width, height);
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
				const promises: any[] = [];

				editor.update(async () => {
					for (const [key, mutation] of mutatedNodes) {
						if (mutation === 'destroyed') continue;

						const node: ImageNode | null = getNodeByKey(key);
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
						const element = editor.getElementByKey(key) as HTMLImageElement | null;

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
				});

				if (promises.length) {
					Promise.all(promises.map((fn) => fn()));
				}
			}),
			editor.registerCommand<InsertImagePayload>(
				INSERT_IMAGE_COMMAND,
				(payload) => {
					wrapperInsertImage(payload);

					return true;
				},
				COMMAND_PRIORITY_EDITOR
			),
			editor.registerCommand<DragEvent>(
				DRAGSTART_COMMAND,
				(event) => {
					return onDragStart(event);
				},
				COMMAND_PRIORITY_HIGH
			),
			editor.registerCommand<DragEvent>(
				DRAGOVER_COMMAND,
				(event) => {
					return onDragover(event);
				},
				COMMAND_PRIORITY_LOW
			),
			editor.registerCommand<DragEvent>(
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
