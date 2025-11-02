<script>
	/** @type {import('lexical').LexicalCommand<MouseEvent>} */
	const RIGHT_CLICK_VIDEOEMBED_COMMAND = createCommand('RIGHT_CLICK_VIDEOEMBED_COMMAND');

	import { onMount } from 'svelte';
	import {
		$getSelection as getSelection,
		$isNodeSelection as isNodeSelection,
		$getNodeByKey as getNodeByKey,
		$isRangeSelection as isRangeSelection,
		createCommand,
		COMMAND_PRIORITY_LOW,
		CLICK_COMMAND,
		KEY_DELETE_COMMAND,
		KEY_BACKSPACE_COMMAND,
		// KEY_ENTER_COMMAND,
		KEY_ESCAPE_COMMAND,
	} from 'lexical';
	import { mergeRegister } from '@lexical/utils';

	import { DOMAIN } from '$lib/environment/environment';
	import {
		clearSelection,
		createNodeSelectionStore,
	} from '$lib/components/editor/utils/getSelection';
	import { VIDEO_MIN_HEIGHT, VIDEO_MIN_WIDTH } from '$lib/constants/video';
	import ImageResizer from '../Image/ImageResizer.svelte';
	import {
		getIframeStyle,
		getURLAndTitle,
		getWidthAndHeight,
		$isVideoEmbedNode as isVideoEmbedNode,
		VideoEmbedNode,
	} from './VideoEmbed';
	import { decoratorFormatToMarginStyle } from './DecoratorBlockNode';

	/**
	 * @typedef {Object} Props
	 * @property {VideoEmbedNode} node
	 * @property {string} src
	 * @property {import('./VideoEmbed').SupportedPlatforms} platform
	 * @property {import('lexical').NodeKey} nodeKey
	 * @property {'inherit' | number} height
	 * @property {'inherit' | number} width
	 * @property {boolean} resizable
	 * @property {import('lexical').ElementFormatType} format
	 * @property {import('lexical').LexicalEditor} editor
	 */

	/** @type {Props} */
	let { node, src, platform, nodeKey, height, width, resizable, format, editor } = $props();

	/** @type {BaseSelection | null} */
	let selection = $state(null);
	/** @type {HTMLDivElement | null} */
	let embedRef = $state(null);
	/** @type {HTMLDivElement | null} */
	let nodeRef = $state(null);
	let isSelected = createNodeSelectionStore(editor, nodeKey);
	let isResizing = $state(false);

	let isFocused = $derived($isSelected || isResizing);
	let parsedSrc = $derived(getURLAndTitle(platform, src, DOMAIN));
	let url = $derived(parsedSrc.url);
	let title = $derived(parsedSrc.title);

	/**
	 * @param {MouseEvent} event
	 * @returns {void}
	 */
	const onRightClick = (event) => {
		editor.read(() => {
			const latestSelection = getSelection();
			const domElement = /** @type {HTMLElement} */ (event.target);
			if (
				domElement.tagName === 'VIDEO' &&
				isRangeSelection(latestSelection) &&
				latestSelection.getNodes().length === 1
			) {
				editor.dispatchCommand(RIGHT_CLICK_VIDEOEMBED_COMMAND, event);
			}
		});
	};

	/** @param {KeyboardEvent} payload */
	const onDelete = (payload) => {
		if ($isSelected && isNodeSelection(getSelection())) {
			/** @type {KeyboardEvent} */
			const event = payload;
			event.preventDefault();
			const node = getNodeByKey(nodeKey);
			if (isVideoEmbedNode(node)) {
				node.remove();
				return true;
			}
		}
		return false;
	};

	// const onEnter = () => {
	// 	const latestSelection = getSelection();
	// 	if (
	// 		$isSelected &&
	// 		isNodeSelection(latestSelection) &&
	// 		latestSelection.getNodes().length === 1
	// 	) {
	// 	}
	// 	return false;
	// };

	const onEscape = () => {
		clearSelection(editor);
		isSelected.set(false);
		editor.update(() => node.selectNext());
		return false;
	};

	/** @param {MouseEvent} payload */
	const onClick = (payload) => {
		const event = payload;

		if (isResizing) {
			return true;
		}

		if (event.target === embedRef) {
			if (event.shiftKey) {
				$isSelected = !$isSelected;
			} else {
				clearSelection(editor);
				$isSelected = true;
			}

			return true;
		}

		return false;
	};

	/**
	 * @param {'inherit' | number} nextWidth
	 * @param {'inherit' | number} nextHeight
	 * @param {number} startWidth
	 * @param {number} startHeight
	 */
	const onResizeEnd = (nextWidth, nextHeight, startWidth, startHeight) => {
		// Delay hiding the resize bars for click case
		setTimeout(() => {
			isResizing = false;
		}, 200);

		editor.update(() => {
			const node = getNodeByKey(nodeKey);
			if (isVideoEmbedNode(node)) {
				const { width: currentWidth, height: currentHeight } = node.getWidthAndHeight();

				const sameWidth = startWidth === nextWidth;
				const sameHeight = startHeight === nextHeight;

				node.setWidthAndHeight({
					width: sameWidth ? currentWidth : nextWidth,
					height: sameHeight ? currentHeight : nextHeight,
				});
			}
		});
	};

	const onResizeStart = () => {
		isResizing = true;
	};

	$effect(() => {
		if (nodeRef?.parentElement) {
			nodeRef.parentElement.style = decoratorFormatToMarginStyle(format);
			if (width !== 'inherit' || height !== 'inherit') {
				nodeRef.parentElement.style.width = 'fit-content';
			}
		}
	});

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
			editor.registerCommand(RIGHT_CLICK_VIDEOEMBED_COMMAND, onClick, COMMAND_PRIORITY_LOW),
			editor.registerCommand(KEY_DELETE_COMMAND, onDelete, COMMAND_PRIORITY_LOW),
			editor.registerCommand(KEY_BACKSPACE_COMMAND, onDelete, COMMAND_PRIORITY_LOW),
			// editor.registerCommand(KEY_ENTER_COMMAND, onEnter, COMMAND_PRIORITY_LOW),
			editor.registerCommand(KEY_ESCAPE_COMMAND, onEscape, COMMAND_PRIORITY_LOW)
		);

		rootElement?.addEventListener('contextmenu', onRightClick);

		return () => {
			isMounted = false;
			unregister();
			rootElement?.removeEventListener('contextmenu', onRightClick);
		};
	});
</script>

<div class="editor-image editor-video" bind:this={nodeRef} style={getWidthAndHeight(width, height)}>
	<div
		bind:this={embedRef}
		class="element-placeholder-color overflow-hidden text-black"
		class:focused={isFocused}
		style={getWidthAndHeight(width, height)}
	>
		<iframe
			class="pointer-events-none"
			srcdoc={!url
				? `<p style="color:#fff;"><strong>No valid URL is provided for this ${platform.toUpperCase()} embed.</strong></p>`
				: undefined}
			{width}
			{height}
			src={url}
			frameBorder="0"
			allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
			allowFullScreen={true}
			{title}
			style={getIframeStyle(width, height)}
		></iframe>
	</div>

	{#if resizable && isNodeSelection(selection) && isFocused}
		<ImageResizer
			{editor}
			imageRef={embedRef}
			{onResizeStart}
			{onResizeEnd}
			minWidth={VIDEO_MIN_WIDTH}
			minHeight={VIDEO_MIN_HEIGHT}
		/>
	{/if}
</div>
