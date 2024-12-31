<script context="module">
	const imageCache = new Set();

	/** @type {import('lexical').LexicalCommand<MouseEvent>} */
	export const RIGHT_CLICK_IMAGE_COMMAND = createCommand('RIGHT_CLICK_IMAGE_COMMAND');
</script>

<script>
	import {
		$getSelection as getSelection,
		$isNodeSelection as isNodeSelection,
		$getNodeByKey as getNodeByKey,
		$isRangeSelection as isRangeSelection,
		createCommand,
		COMMAND_PRIORITY_LOW,
		CLICK_COMMAND,
		DRAGSTART_COMMAND,
		KEY_DELETE_COMMAND,
		KEY_BACKSPACE_COMMAND,
		KEY_ESCAPE_COMMAND,
		KEY_ENTER_COMMAND,
		DELETE_CHARACTER_COMMAND,
		$isParagraphNode as isParagraphNode,
		$isElementNode as isElementNode,
		$isTextNode as isTextNode,
	} from 'lexical';
	import { onMount } from 'svelte';
	import { mergeRegister } from '@lexical/utils';
	import {
		clearSelection,
		createNodeSelectionStore,
	} from '$lib/components/editor/utils/getSelection';
	import ImageResizer from './ImageResizer.svelte';
	import {
		IMAGE_OFF,
		ImageNode,
		LUCIDE_ICON_LOADER,
		TRANSPARENT_IMAGE,
		$isImageNode as isImageNode,
	} from './Image';

	/** @type {ImageNode} */
	export let node;
	/** @type {string} */
	export let src;
	/** @type {string} */
	export let altText;
	/** @type {string} */
	export let nodeKey;
	/** @type {'inherit' | number} */
	export let width;
	/** @type {'inherit' | number} */
	export let height;
	/** @type {boolean} */
	export let resizable;
	/** @type {import('lexical').LexicalEditor} */
	export let editor;

	$: heightCss = height === 'inherit' ? 'inherit' : height + 'px';
	$: widthCss = width === 'inherit' ? 'inherit' : width + 'px';

	/** @type {BaseSelection | null} */
	let selection = null;

	/** @type {HTMLElement | HTMLImageElement | null} */
	let imageRef;
	let isSelected = createNodeSelectionStore(editor, nodeKey);
	let isResizing = false;

	$: draggable = $isSelected && isNodeSelection(selection) && !isResizing;
	$: isFocused = $isSelected || isResizing;

	let promise = new Promise((resolve) => {
		if (imageCache.has(src)) {
			resolve(src);
		} else {
			const img = new Image();
			img.src = src;
			img.onload = () => {
				imageCache.add(src);
				resolve(src);
			};
		}
	});

	/**
	 * Bug fix to prevent character deletion from accidentally removing image.
	 * @param {RangeSelection} selection
	 * @param {LexicalNode} currentNode
	 */
	const onDeleteCharacterDecorationBug = (selection, currentNode) => {
		const currentNodeParent = currentNode.getParent();

		if (!currentNodeParent) {
			return false;
		}

		/**
		 * @type {ElementNode | null}
		 */
		const prevSibling = currentNodeParent.getPreviousSibling();

		if (!prevSibling || !isElementNode(prevSibling)) {
			return false;
		}

		const prevNode = prevSibling.getLastChild();

		if (!isImageNode(prevNode)) {
			return false;
		}

		if (currentNodeParent === prevSibling) {
			return false;
		}

		if (!isParagraphNode(currentNodeParent) || !isParagraphNode(prevSibling)) {
			return false;
		}

		const start = currentNodeParent.getFirstChild();

		if (currentNode !== start || selection.anchor.offset !== 0) {
			return false;
		}

		const children = currentNodeParent.getChildren();

		editor.update(() => {
			prevSibling.append(...children);

			currentNodeParent.remove();
		});

		return true;
	};

	/**
	 * @param {LexicalNode} currentNode
	 */
	const onDeleteCharacterNextToImage = (currentNode) => {
		if (currentNode !== node) {
			return false;
		}

		if (isImageNode(currentNode) && !$isSelected) {
			imageRef?.click();
			return true;
		}
	};

	/**
	 * @param {boolean} payload
	 */
	const onDeleteCharacter = (payload) => {
		if (!payload) {
			return false;
		}

		const selection = /** @type {RangeSelection | undefined} */ (getSelection()?.clone());

		if (!selection?.isCollapsed()) {
			return false;
		}

		const currentNode = selection.getNodes()[0];

		if (onDeleteCharacterDecorationBug(selection, currentNode)) {
			return true;
		}

		if (onDeleteCharacterNextToImage(currentNode)) {
			return true;
		}

		const prevSibling = currentNode.getPreviousSibling();

		if (prevSibling && isImageNode(prevSibling) && node === prevSibling && !isTextNode(currentNode)) {
			imageRef?.click();
			return true;
		}

		if (prevSibling && isElementNode(prevSibling)) {
			const prevSiblingLastChild = prevSibling.getLastChild();

			if (prevSibling && isImageNode(prevSiblingLastChild) && node === prevSiblingLastChild) {
				imageRef?.click();
				return true;
			}
		}

		return false;
	};

	/** @param {KeyboardEvent} payload */
	const onDelete = (payload) => {
		if ($isSelected && isNodeSelection(getSelection())) {
			/** @type {KeyboardEvent} */
			const event = payload;
			event.preventDefault();
			const node = getNodeByKey(nodeKey);
			if (isImageNode(node)) {
				node.remove();
				return true;
			}
		}
		return false;
	};

	const onEnter = () => {
		const latestSelection = getSelection();
		if (
			$isSelected &&
			isNodeSelection(latestSelection) &&
			latestSelection.getNodes().length === 1
		) {
		}
		return false;
	};

	const onEscape = () => {
		clearSelection(editor);

		if ($isSelected) {
			$isSelected = false;

			const cleanNodeRef = getNodeByKey(nodeKey);

			if (cleanNodeRef) {
				editor.update(() => cleanNodeRef.selectEnd());
				return true;
			}
		}

		return false;
	};

	/** @param {MouseEvent} payload */
	const onClick = (payload) => {
		const event = payload;

		if (isResizing) {
			return true;
		}
		if (event.target === imageRef) {
			if (event.shiftKey) {
				$isSelected = !$isSelected;
				editor.update(() => node.selectEnd());
			} else {
				clearSelection(editor);
				$isSelected = true;
			}

			return true;
		}

		return false;
	};

	/**
	 * @param {MouseEvent} event
	 * @returns {void}
	 */
	const onRightClick = (event) => {
		editor.read(() => {
			const latestSelection = getSelection();
			const domElement = /** @type {HTMLElement} */ (event.target);
			if (
				domElement.tagName === 'IMG' &&
				isRangeSelection(latestSelection) &&
				latestSelection.getNodes().length === 1
			) {
				editor.dispatchCommand(RIGHT_CLICK_IMAGE_COMMAND, event);
			}
		});
	};

	onMount(() => {
		let isMounted = true;
		const rootElement = editor.getRootElement();
		const unregister = mergeRegister(
			editor.registerUpdateListener(({ editorState }) => {
				if (isMounted) {
					selection = editorState.read(() => getSelection());
				}
			}),
			editor.registerCommand(CLICK_COMMAND, onClick, COMMAND_PRIORITY_LOW),
			editor.registerCommand(RIGHT_CLICK_IMAGE_COMMAND, onClick, COMMAND_PRIORITY_LOW),
			editor.registerCommand(
				DRAGSTART_COMMAND,
				(event) => {
					if (event.target === imageRef) {
						// TODO This is just a temporary workaround for FF to behave like other browsers.
						// Ideally, this handles drag & drop too (and all browsers).
						event.preventDefault();
						return true;
					}
					return false;
				},
				COMMAND_PRIORITY_LOW
			),
			editor.registerCommand(KEY_DELETE_COMMAND, onDelete, COMMAND_PRIORITY_LOW),
			editor.registerCommand(KEY_BACKSPACE_COMMAND, onDelete, COMMAND_PRIORITY_LOW),
			editor.registerCommand(DELETE_CHARACTER_COMMAND, onDeleteCharacter, COMMAND_PRIORITY_LOW),
			editor.registerCommand(KEY_ENTER_COMMAND, onEnter, COMMAND_PRIORITY_LOW),
			editor.registerCommand(KEY_ESCAPE_COMMAND, onEscape, COMMAND_PRIORITY_LOW)
		);

		rootElement?.addEventListener('contextmenu', onRightClick);

		return () => {
			isMounted = false;
			unregister();
			rootElement?.removeEventListener('contextmenu', onRightClick);
		};
	});

	/**
	 * @param {'inherit' | number} nextWidth
	 * @param {'inherit' | number} nextHeight
	 */
	const onResizeEnd = (nextWidth, nextHeight) => {
		// Delay hiding the resize bars for click case
		setTimeout(() => {
			isResizing = false;
		}, 200);

		editor.update(() => {
			const node = getNodeByKey(nodeKey);
			if (isImageNode(node)) {
				node.setWidthAndHeight({ width: nextWidth, height: nextHeight });
			}
		});
	};

	const onResizeStart = () => {
		isResizing = true;
	};
</script>

<div {draggable}>
	{#await promise}
		<figure
			style="height:{heightCss};px;width:{widthCss};"
			class="element-placeholder-color m-0 flex animate-pulse items-center justify-center p-0"
			class:focused={isFocused}
			class:draggable={isFocused && isNodeSelection(selection)}
			title="Loading image..."
			bind:this={imageRef}
			draggable="false"
		>
			<img
				class="pointer-events-none m-0 animate-spin rounded-full"
				src={LUCIDE_ICON_LOADER}
				alt={altText}
			/>
		</figure>
	{:then _}
		<img
			class:focused={isFocused}
			class:draggable={isFocused && isNodeSelection(selection)}
			class="m-0"
			src={src === TRANSPARENT_IMAGE ? IMAGE_OFF : src}
			alt={altText}
			bind:this={imageRef}
			style="height:{heightCss};px;width:{widthCss};"
			draggable="false"
		/>
	{/await}
</div>
{#if resizable && isNodeSelection(selection) && isFocused}
	<ImageResizer {editor} {imageRef} {onResizeStart} {onResizeEnd} />
{/if}
