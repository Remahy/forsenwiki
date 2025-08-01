<script>
	const imageCache = new Set();

	/** @type {import('lexical').LexicalCommand<MouseEvent>} */
	export const RIGHT_CLICK_IMAGE_COMMAND = createCommand('RIGHT_CLICK_IMAGE_COMMAND');

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
	} from 'lexical';
	import { onMount } from 'svelte';
	import { mergeRegister } from '@lexical/utils';
	import {
		clearSelection,
		createNodeSelectionStore,
	} from '$lib/components/editor/utils/getSelection';
	import { IMAGE_MIN_HEIGHT, IMAGE_MIN_WIDTH } from '$lib/constants/image';
	import ImageResizer from './ImageResizer.svelte';
	import {
		IMAGE_OFF,
		ImageNode,
		LUCIDE_ICON_LOADER,
		TRANSPARENT_IMAGE,
		$isImageNode as isImageNode,
	} from './Image';

	/**
	 * @typedef {Object} Props
	 * @property {ImageNode} node
	 * @property {string} src
	 * @property {string} altText
	 * @property {string} nodeKey
	 * @property {'inherit' | number} width
	 * @property {'inherit' | number} height
	 * @property {boolean} resizable
	 * @property {import('lexical').LexicalEditor} editor
	 */

	/** @type {Props} */
	let {
		node,
		src,
		altText,
		nodeKey,
		width,
		height,
		resizable,
		editor
	} = $props();

	let heightCss = $derived(height === 'inherit' ? 'inherit' : height + 'px');
	let widthCss = $derived(width === 'inherit' ? 'inherit' : width + 'px');

	/** @type {BaseSelection | null} */
	let selection = $state(null);

	/** @type {HTMLElement | HTMLImageElement | null} */
	let imageRef = $state(null);
	let isSelected = createNodeSelectionStore(editor, nodeKey);
	let isResizing = $state(false);

	let draggable = $derived($isSelected && isNodeSelection(selection) && !isResizing);
	let isFocused = $derived($isSelected || isResizing);

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
			class="element-placeholder-color !m-0 flex animate-pulse items-center justify-center p-0"
			class:focused={isFocused}
			class:draggable={isFocused && isNodeSelection(selection)}
			title="Loading image..."
			bind:this={imageRef}
			draggable="false"
		>
			<img
				class="pointer-events-none !m-0 animate-spin rounded-full"
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
			style="height:{heightCss};width:{widthCss};"
			draggable="false"
		/>
	{/await}
</div>
{#if resizable && isNodeSelection(selection) && isFocused}
	<ImageResizer {editor} {imageRef} {onResizeStart} {onResizeEnd} minWidth={IMAGE_MIN_WIDTH} minHeight={IMAGE_MIN_HEIGHT} />
{/if}
