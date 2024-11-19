<script context="module">
	/** @type {import('lexical').LexicalCommand<MouseEvent>} */
	export const RIGHT_CLICK_VIDEOEMBED_COMMAND = createCommand('RIGHT_CLICK_VIDEOEMBED_COMMAND');
</script>

<script>
	import '../Image/Image.css';

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
		KEY_ENTER_COMMAND,
		KEY_ESCAPE_COMMAND,
	} from 'lexical';
	import { mergeRegister } from '@lexical/utils';

	import { DOMAIN } from '$lib/environment/environment';
	import {
		clearSelection,
		createNodeSelectionStore,
	} from '$lib/components/editor/utils/getSelection';
	import ImageResizer from '../Image/ImageResizer.svelte';
	import {
		getURLAndTitle,
		$isVideoEmbedNode as isVideoEmbedNode,
		VideoEmbedNode,
	} from './VideoEmbed';

	/** @type {VideoEmbedNode} */
	export let node;
	/** @type {string} */
	export let src;
	/** @type {import('./VideoEmbed').SupportedPlatforms} */
	export let platform;
	/** @type {import('lexical').NodeKey} */
	export let nodeKey;
	/** @type {'inherit' | number} */
	export let height;
	/** @type {'inherit' | number} */
	export let width;
	/** @type {boolean} */
	export let resizable;
	/** @type {import('lexical').LexicalEditor} */
	export let editor;

	/** @type {BaseSelection | null} */
	let selection = null;
	/** @type {HTMLDivElement | null} */
	let embedRef;
	let isSelected = createNodeSelectionStore(editor, nodeKey);
	let isResizing = false;

	$: isFocused = $isSelected || isResizing;
	$: parsedSrc = getURLAndTitle(platform, src, DOMAIN);
	$: url = parsedSrc.url;
	$: title = parsedSrc.title;

	/**
	 * @param {MouseEvent} event
	 * @returns {void}
	 */
	const onRightClick = (event) => {
		editor.getEditorState().read(() => {
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
		$isSelected = false;
		editor.update(() => node.selectNext());
		return false;
	};

	/** @param {MouseEvent} payload */
	const onClick = (payload) => {
		const event = payload;

		// if (isResizing) {
		// 	return true;
		// }
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
	 */
	const onResizeEnd = (nextWidth, nextHeight) => {
		// Delay hiding the resize bars for click case
		setTimeout(() => {
			isResizing = false;
		}, 200);

		editor.update(() => {
			const node = getNodeByKey(nodeKey);
			if (isVideoEmbedNode(node)) {
				node.setWidthAndHeight({ width: nextWidth, height: nextHeight });
			}
		});
	};

	const onResizeStart = () => {
		isResizing = true;
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
			editor.registerCommand(RIGHT_CLICK_VIDEOEMBED_COMMAND, onClick, COMMAND_PRIORITY_LOW),
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
</script>

<div
	bind:this={embedRef}
	class="overflow-hidden bg-violet-500 bg-opacity-50"
	class:focused={isFocused}
	class:draggable={isFocused && isNodeSelection(selection)}
	draggable="false"
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
	/>
</div>
{#if resizable && isNodeSelection(selection) && isFocused}
	<ImageResizer {editor} imageRef={embedRef} {onResizeStart} {onResizeEnd} />
{/if}
