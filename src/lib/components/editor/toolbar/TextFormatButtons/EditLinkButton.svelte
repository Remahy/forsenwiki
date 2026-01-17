<script>
	import { onMount } from 'svelte';
	import { Link2Icon, SettingsIcon } from 'lucide-svelte';
	import {
		COMMAND_PRIORITY_HIGH,
		COMMAND_PRIORITY_NORMAL,
		KEY_DOWN_COMMAND,
		$getSelection as getSelection,
		$isRangeSelection as isRangeSelection,
		$createRangeSelection as createRangeSelection,
		$setSelection as setSelection,
	} from 'lexical';
	import { TOGGLE_LINK_COMMAND, $toggleLink as toggleLink } from '@lexical/link';
	import { $getNearestNodeOfType as getNearestNodeOfType, mergeRegister } from '@lexical/utils';
	import { getEditor } from 'svelte-lexical';

	import { ctrlKey } from '$lib/environment/environment';
	import { getSelectedNode } from '$lib/components/editor/utils/getSelection';
	import { modal } from '$lib/stores/modal';
	import { ALinkNode, $isALinkNode as isALinkNode } from '$lib/lexical/custom';
	import EditorButton from '../EditorButton.svelte';
	import EditLinkButtonModal from './EditLinkButtonModal.svelte';

	/**
	 * @typedef {import('lexical').PointType} PointType
	 */

	let hasLink = $state(false);

	let isDisabled = $state(false);

	let url = $state('');

	let attrs = $state({});

	let isInternal = $state(false);

	/** @type {string | undefined} */
	let internalId = $state();

	let editor = $derived(getEditor?.());

	const link = () => {
		if (!hasLink) {
			return editor.dispatchCommand(TOGGLE_LINK_COMMAND, '');
		} else {
			return editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
		}
	};

	/**
	 * @param {string | null} definedUrl
	 * @param {{ target?: string | null, rel?: string | null, title?: string | null }} [definedAttrs]
	 */
	const wrapperToggleLink = (definedUrl, definedAttrs) => {
		modal.set({
			component: EditLinkButtonModal,
			hasLink,
			/**
			 * @param {{ url: string, isInternal: boolean, internalId?: string }} arg0
			 * @param {import('@lexical/link').LinkAttributes} [dAttrs]
			 */
			onSubmit: ({ url, isInternal, internalId }, dAttrs) => {
				editor.update(() => {
					const selection = getSelection();

					if (selection && url && definedUrl === '' && selection.isCollapsed()) {
						const [, anchor] = /** @type {[PointType, PointType]}*/ (selection.getStartEndPoints());
						const anchorOffset = anchor.offset;

						const text = dAttrs?.title || url;
						selection.insertText(text);

						// Modify selection to only wrap the new text.
						const [, newFocus] = /** @type {[PointType, PointType]}*/ (
							selection.getStartEndPoints()
						);

						const newSelection = createRangeSelection();
						newSelection.anchor.set(anchor.key, anchorOffset, 'text');
						newSelection.focus.set(anchor.key, newFocus.offset, 'text');

						setSelection(newSelection);
					}

					toggleLink(url, dAttrs);

					if (isRangeSelection(selection)) {
						const anchorNode = selection.anchor.getNode();
						const link = getNearestNodeOfType(anchorNode, ALinkNode);

						link?.setIsInternal(isInternal);
						link?.setInternalId(internalId);
					}
				});
			},
			deleteLink: () => {
				editor.update(() => toggleLink(null));
			},
			url: definedUrl || url,
			attrs: definedAttrs || attrs,
			isInternal,
			internalId,
			isOpen: true,
		});
	};

	const updateToolbar = () => {
		editor.read(() => {
			const selection = getSelection();

			if (!isRangeSelection(selection)) {
				isDisabled = true;
				return;
			} else {
				isDisabled = false;
			}

			/** @type {LexicalNode} */
			const node = getSelectedNode(selection);
			const parent = node.getParent();

			if (isALinkNode(node)) {
				hasLink = true;
				url = node.__url;
				attrs = { ...node };
				isInternal = node.__isInternal;
				internalId = node.__internalId;
			} else if (isALinkNode(parent)) {
				hasLink = true;
				url = parent.__url;
				attrs = { ...parent };
				isInternal = parent.__isInternal;
				internalId = parent.__internalId;
			} else {
				hasLink = false;
				url = '';
				attrs = {};
				isInternal = false;
				internalId = undefined;
			}
		});
	};

	onMount(() => {
		return mergeRegister(
			editor.registerUpdateListener(() => {
				updateToolbar();
			}),

			editor.registerCommand(
				KEY_DOWN_COMMAND,
				// @ts-ignore
				(payload) => {
					const event = payload;
					const { code, ctrlKey, metaKey } = event;
					if (code === 'KeyK' && (ctrlKey || metaKey)) {
						event.preventDefault();
						return link();
					}
					return false;
				},
				COMMAND_PRIORITY_NORMAL
			),

			editor.registerCommand(
				TOGGLE_LINK_COMMAND,
				(payload) => {
					if (typeof payload === 'string') {
						wrapperToggleLink(payload);
						return true;
					} else if (payload) {
						wrapperToggleLink(payload.url, { ...payload });
						return true;
					}

					wrapperToggleLink(payload);
					return true;
				},
				COMMAND_PRIORITY_HIGH
			)
		);
	});
</script>

<EditorButton
	title="Insert link ({ctrlKey}K)"
	on:click={link}
	isActive={hasLink}
	disabled={isDisabled}
>
	{#if hasLink}
		<Link2Icon />
		<SettingsIcon size="16" class="absolute top-0 right-0" />
	{:else}
		<Link2Icon />
	{/if}
</EditorButton>
