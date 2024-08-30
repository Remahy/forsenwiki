<script lang="ts">
	import {
		$getSelection as getSelection,
		$isNodeSelection as isNodeSelection,
		$getNodeByKey as getNodeByKey,
		COMMAND_PRIORITY_LOW,
		CLICK_COMMAND,
		KEY_DELETE_COMMAND,
		KEY_BACKSPACE_COMMAND,
		KEY_ENTER_COMMAND,
		KEY_ESCAPE_COMMAND,
		type LexicalEditor,
		type BaseSelection,
		type NodeKey,
	} from 'lexical';
	import { clearSelection, createNodeSelectionStore } from '../../utils/getSelection';
	import { $isFallbackNode as isFallbackNode, type FallbackNode } from './Fallback';
	import { mergeRegister } from '@lexical/utils';
	import { onMount } from 'svelte';

	export let node: FallbackNode;
	export let nodeKey: NodeKey;
	export let data: any;
	export let editor: LexicalEditor;

	let selection: BaseSelection | null = null;
	let embedRef: HTMLDivElement | null;
	let isSelected = createNodeSelectionStore(editor, nodeKey);
	let isResizing = false;

	$: isFocused = $isSelected || isResizing;

	const onDelete = (payload: KeyboardEvent) => {
		if ($isSelected && isNodeSelection(getSelection())) {
			const event: KeyboardEvent = payload;
			event.preventDefault();
			const node = getNodeByKey(nodeKey);
			if (isFallbackNode(node)) {
				node.remove();
				return true;
			}
		}
		return false;
	};

	const onEnter = (event: KeyboardEvent) => {
		const latestSelection = getSelection();
		if (
			$isSelected &&
			isNodeSelection(latestSelection) &&
			latestSelection.getNodes().length === 1
		) {
		}
		return false;
	};

	const onEscape = (event: KeyboardEvent) => {
		clearSelection(editor);
		$isSelected = false;
		editor.update(() => node.selectNext());
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

	onMount(() => {
		let isMounted = true;
		const unregister = mergeRegister(
			editor.registerUpdateListener(({ editorState }) => {
				if (isMounted) {
					selection = editorState.read(() => getSelection());
				}
			}),
			editor.registerCommand<MouseEvent>(CLICK_COMMAND, onClick, COMMAND_PRIORITY_LOW),
			editor.registerCommand(KEY_DELETE_COMMAND, onDelete, COMMAND_PRIORITY_LOW),
			editor.registerCommand(KEY_BACKSPACE_COMMAND, onDelete, COMMAND_PRIORITY_LOW),
			editor.registerCommand(KEY_ENTER_COMMAND, onEnter, COMMAND_PRIORITY_LOW),
			editor.registerCommand(KEY_ESCAPE_COMMAND, onEscape, COMMAND_PRIORITY_LOW)
		);

		return () => {
			isMounted = false;
			unregister();
		};
	});
</script>

<div
	bind:this={embedRef}
	class="mb-1 overflow-hidden rounded bg-red-500 bg-opacity-50 p-4"
	class:focused={isFocused}
	class:draggable={isFocused && isNodeSelection(selection)}
	class:outline={isFocused}
	class:outline-blue-500={isFocused}
	draggable="false"
>
	<div class="pointer-events-none text-xs">
		<p class="m-0 h-[unset] leading-none">
			<strong>Invalid node of type: &quot;{JSON.parse(data).type}&quot;</strong>
		</p>
		<pre class="m-0">{JSON.stringify(JSON.parse(data), null, 2)}</pre>
		<p class="m-0 h-[unset] leading-none"><strong>Delete or migrate node.</strong></p>
	</div>
</div>
