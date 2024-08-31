<script context="module" lang="ts">
	const imageCache = new Set();

	export const RIGHT_CLICK_IMAGE_COMMAND: LexicalCommand<MouseEvent> = createCommand(
		'RIGHT_CLICK_IMAGE_COMMAND'
	);
</script>

<script lang="ts">
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
		DRAGSTART_COMMAND,
		KEY_DELETE_COMMAND,
		KEY_BACKSPACE_COMMAND,
		KEY_ESCAPE_COMMAND,
		KEY_ENTER_COMMAND,
		type BaseSelection,
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

	export let node: ImageNode;
	export let src: string;
	export let altText: string;
	export let nodeKey: string;
	export let width: 'inherit' | number;
	export let height: 'inherit' | number;
	export let resizable: boolean;
	export let editor: LexicalEditor;

	$: heightCss = height === 'inherit' ? 'inherit' : height + 'px';
	$: widthCss = width === 'inherit' ? 'inherit' : width + 'px';

	let selection: BaseSelection | null = null;

	let imageRef: HTMLImageElement | null;
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

	const onDelete = (payload: KeyboardEvent) => {
		if ($isSelected && isNodeSelection(getSelection())) {
			const event: KeyboardEvent = payload;
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
		$isSelected = false;
		editor.update(() => node.selectNext());
		return false;
	};

	const onClick = (payload: MouseEvent) => {
		const event = payload;

		if (isResizing) {
			return true;
		}
		if (event.target === imageRef) {
			if (event.shiftKey) {
				$isSelected = !$isSelected;
				editor.update(() => node.selectNext());
			} else {
				clearSelection(editor);
				$isSelected = true;
			}
			return true;
		}

		return false;
	};

	const onRightClick = (event: MouseEvent): void => {
		editor.getEditorState().read(() => {
			const latestSelection = getSelection();
			const domElement = event.target as HTMLElement;
			if (
				domElement.tagName === 'IMG' &&
				isRangeSelection(latestSelection) &&
				latestSelection.getNodes().length === 1
			) {
				editor.dispatchCommand(RIGHT_CLICK_IMAGE_COMMAND, event as MouseEvent);
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
			editor.registerCommand<MouseEvent>(CLICK_COMMAND, onClick, COMMAND_PRIORITY_LOW),
			editor.registerCommand<MouseEvent>(RIGHT_CLICK_IMAGE_COMMAND, onClick, COMMAND_PRIORITY_LOW),
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

	const onResizeEnd = (nextWidth: 'inherit' | number, nextHeight: 'inherit' | number) => {
		// Delay hiding the resize bars for click case
		setTimeout(() => {
			isResizing = false;
		}, 200);

		editor.update(() => {
			const node = getNodeByKey(nodeKey);
			if (isImageNode(node)) {
				node.setWidthAndHeight(nextWidth, nextHeight);
			}
		});
	};

	const onResizeStart = () => {
		isResizing = true;
	};
</script>

<div {draggable}>
	{#await promise}
		<img
			class:focused={isFocused}
			class:draggable={isFocused && isNodeSelection(selection)}
			class="m-0 animate-spin rounded-full dark:bg-white"
			src={LUCIDE_ICON_LOADER}
			title="Loading image..."
			alt={altText}
			bind:this={imageRef}
			style="height:{heightCss};px;width:{widthCss};"
			draggable="false"
		/>
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
