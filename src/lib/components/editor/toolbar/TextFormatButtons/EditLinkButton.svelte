<script>
	import { onMount } from 'svelte';
	import {
		COMMAND_PRIORITY_HIGH,
		COMMAND_PRIORITY_NORMAL,
		KEY_MODIFIER_COMMAND,
		$getSelection as getSelection,
		$isRangeSelection as isRangeSelection,
	} from 'lexical';
	import { getEditor } from 'svelte-lexical';
	import { TOGGLE_LINK_COMMAND, $toggleLink as toggleLink } from '@lexical/link';
	import { Link2Icon, SettingsIcon } from 'lucide-svelte';

	import { ctrlKey } from '$lib/environment/environment';
	import { getSelectedNode } from '$lib/components/editor/utils/getSelection';
	import { modal } from '$lib/stores/modal';
	import { $isALinkNode as isALinkNode } from '$lib/lexical/custom';
	import EditorButton from '../EditorButton.svelte';
	import EditLinkButtonModal from './EditLinkButtonModal.svelte';
	import { mergeRegister } from '@lexical/utils';

	$: hasLink = false;
	$: url = '';
	$: attrs = {};
	$: isInternal = false;

	const editor = getEditor();

	const link = () => {
		if (!hasLink) {
			return editor.dispatchCommand(TOGGLE_LINK_COMMAND, 'https://');
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
			 * @param {string | null} dUrl
			 * @param {import("@lexical/link").LinkAttributes} [dAttrs]
			 */
			onSubmit: (dUrl, dAttrs) => {
				editor.update(() => {
					const selection = getSelection();

					if (selection && dUrl && definedUrl === 'https://') {
						const textLength = selection
							.getNodes()
							.map((node) => node.getTextContentSize())
							.reduce((prev, curr) => prev + curr, 0);

						// Add as text if selection didn't have any.
						if (textLength === 0) {
							const title = dAttrs?.title;
							selection.insertText(title || dUrl);
						}
					}

					toggleLink(dUrl, dAttrs);
				});
			},
			deleteLink: () => {
				editor.update(() => toggleLink(null));
			},
			url: definedUrl || url,
			attrs: definedAttrs || attrs,
			isInternal,
			isOpen: true,
		});
	};

	const updateToolbar = () => {
		editor.read(() => {
			const selection = getSelection();

			if (!isRangeSelection(selection)) {
				return;
			}

			/** @type {LexicalNode} */
			const node = getSelectedNode(selection);
			const parent = node.getParent();

			if (isALinkNode(node)) {
				hasLink = true;
				url = node.__url;
				attrs = { ...node };
				isInternal = node.__isInternal;
			} else if (isALinkNode(parent)) {
				hasLink = true;
				url = parent.__url;
				attrs = { ...parent };
				isInternal = parent.__isInternal;
			} else {
				hasLink = false;
				url = '';
				attrs = {};
				isInternal = false;
			}
		});
	};

	onMount(() => {
		return mergeRegister(
			editor.registerUpdateListener(() => {
				updateToolbar();
			}),

			editor.registerCommand(
				KEY_MODIFIER_COMMAND,
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

<EditorButton title="Insert link ({ctrlKey}K)" on:click={link} isActive={hasLink}>
	{#if hasLink}
		<Link2Icon />
		<SettingsIcon size="16" class="absolute right-0 top-0" />
	{:else}
		<Link2Icon />
	{/if}
</EditorButton>
