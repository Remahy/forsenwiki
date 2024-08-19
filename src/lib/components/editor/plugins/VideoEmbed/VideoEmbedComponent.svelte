<script context="module" lang="ts">
	export const RIGHT_CLICK_VIDEOEMBED_COMMAND: LexicalCommand<MouseEvent> = createCommand(
		'RIGHT_CLICK_VIDEOEMBED_COMMAND'
	);
</script>

<script lang="ts">
	import '../Image/Image.css';

	import {
		$getSelection as getSelection,
		$isNodeSelection as isNodeSelection,
		type LexicalEditor,
		type LexicalCommand,
		$getNodeByKey as getNodeByKey,
		$isRangeSelection as isRangeSelection,
		createCommand,
		COMMAND_PRIORITY_LOW,
		CLICK_COMMAND,
		type BaseSelection,
		KEY_DELETE_COMMAND,
		KEY_BACKSPACE_COMMAND,
		KEY_ENTER_COMMAND,
		KEY_ESCAPE_COMMAND,
	} from 'lexical';
	import { mergeRegister } from '@lexical/utils';
	import { onMount } from 'svelte';

	import { DOMAIN } from '$lib/environment/environment';
	import {
		clearSelection,
		createNodeSelectionStore,
	} from '$lib/components/editor/utils/getSelection';
	import ImageResizer from '../Image/ImageResizer.svelte';
	import { getURLAndTitle, $isVideoEmbedNode as isVideoEmbedNode } from './VideoEmbed';

	export let src: string;
	export let platform: string;
	export let nodeKey: string;
	export let height: number | 'inherit';
	export let width: number | 'inherit';
	export let resizable: boolean;
	export let editor: LexicalEditor;

	let selection: BaseSelection | null = null;
	let embedRef: HTMLDivElement | null;
	let buttonRef: HTMLButtonElement | null;
	let isSelected = createNodeSelectionStore(editor, nodeKey);
	let isResizing = false;

	$: isFocused = $isSelected || isResizing;
	$: parsedSrc = getURLAndTitle(platform, src, DOMAIN);
	$: url = parsedSrc?.url;
	$: title = parsedSrc?.title || 'Unknown source';

	const onRightClick = (event: MouseEvent): void => {
		editor.getEditorState().read(() => {
			const latestSelection = getSelection();
			const domElement = event.target as HTMLElement;
			if (
				domElement.tagName === 'VIDEO' &&
				isRangeSelection(latestSelection) &&
				latestSelection.getNodes().length === 1
			) {
				editor.dispatchCommand(RIGHT_CLICK_VIDEOEMBED_COMMAND, event as MouseEvent);
			}
		});
	};

	const onDelete = (payload: KeyboardEvent) => {
		if ($isSelected && isNodeSelection(getSelection())) {
			const event: KeyboardEvent = payload;
			event.preventDefault();
			const node = getNodeByKey(nodeKey);
			if (isVideoEmbedNode(node)) {
				node.remove();
				return true;
			}
		}
		return false;
	};

	const onEnter = (event: KeyboardEvent) => {
		const latestSelection = getSelection();
		const buttonElem = buttonRef;
		if (
			$isSelected &&
			isNodeSelection(latestSelection) &&
			latestSelection.getNodes().length === 1
		) {
			if (buttonElem !== null && buttonElem !== document.activeElement) {
				event.preventDefault();
				buttonElem.focus();
				return true;
			}
		}
		return false;
	};

	const onEscape = (event: KeyboardEvent) => {
		if (buttonRef === event.target) {
			selection = null;
			editor.update(() => {
				$isSelected = true;
				const parentRootElement = editor.getRootElement();
				if (parentRootElement !== null) {
					parentRootElement.focus();
				}
			});
			return true;
		}
		return false;
	};

	const onClick = (payload: MouseEvent) => {
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

	const onResizeEnd = (nextWidth: 'inherit' | number, nextHeight: 'inherit' | number) => {
		// Delay hiding the resize bars for click case
		setTimeout(() => {
			isResizing = false;
		}, 200);

		editor.update(() => {
			const node = getNodeByKey(nodeKey);
			if (isVideoEmbedNode(node)) {
				node.setWidthAndHeight(nextWidth, nextHeight);
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
			editor.registerCommand<MouseEvent>(CLICK_COMMAND, onClick, COMMAND_PRIORITY_LOW),
			editor.registerCommand<MouseEvent>(
				RIGHT_CLICK_VIDEOEMBED_COMMAND,
				onClick,
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
</script>

<div
	bind:this={embedRef}
	class="bg-violet-500 bg-opacity-50 overflow-hidden"
	class:focused={isFocused}
	class:draggable={isFocused && isNodeSelection(selection)}
	draggable="false"
>
	<iframe
		class="pointer-events-none"
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
