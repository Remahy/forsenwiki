<script>
	import { TOGGLE_LINK_COMMAND, $toggleLink as toggleLink } from '@lexical/link';
	import {
		COMMAND_PRIORITY_CRITICAL,
		COMMAND_PRIORITY_HIGH,
		COMMAND_PRIORITY_NORMAL,
		KEY_MODIFIER_COMMAND,
		SELECTION_CHANGE_COMMAND,
		$getSelection as getSelection,
		$isRangeSelection as isRangeSelection,
	} from 'lexical';
	import { Link2Icon, SettingsIcon } from 'lucide-svelte';
	import { getContext, onMount } from 'svelte';

	import Button from '$lib/components/Button.svelte';
	import { ctrlKey } from '$lib/environment/environment';
	import { getSelectedNode } from '$lib/components/editor/utils/getSelection';
	import { modal } from '$lib/stores/modal';
	import { $isALinkNode as isALinkNode } from '$lib/lexicalCustom';
	import EditLinkButtonModal from './EditLinkButtonModal.svelte';

	$: hasLink = false;
	$: url = '';
	$: attrs = {};
	$: isInternal = false;

	/** @type {ComposerWritable} */
	const c = getContext('COMPOSER');
	$: composer = $c;
	$: editor = composer?.getEditor?.();
	$: canEdit = editor?.isEditable();

	const link = () => {
		if (!editor) return;

		if (!hasLink) {
			return editor.dispatchCommand(TOGGLE_LINK_COMMAND, 'https://');
		} else {
			return editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
		}
	};

	/**
	 * @param {string | null} definedUrl
	 * @param {{ target?: string | null, rel?: string | null, title?: string | null } | undefined} definedAttrs
	 */
	const wrapperToggleLink = (definedUrl, definedAttrs = undefined) => {
		if (!editor) return;

		modal.set({
			component: EditLinkButtonModal,
			hasLink,
			/**
			 * @param {string | null} dUrl
			 * @param {import("@lexical/link").LinkAttributes | undefined} dAttrs
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
		/**
		 * @type { BaseSelection & { hasFormat?: (format: string) => boolean } | null }
		 */
		const selection = getSelection();

		if (!selection?.hasFormat) {
			return;
		}

		if (isRangeSelection(selection)) {
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
		}
	};

	onMount(() => {
		c.subscribe((composer) => {
			if (!composer) {
				return;
			}

			const editor = composer.getEditor();

			editor.registerCommand(
				SELECTION_CHANGE_COMMAND,
				(_payload) => {
					updateToolbar();
					return false;
				},
				COMMAND_PRIORITY_CRITICAL
			);

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
			);

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
			);
		});
	});
</script>

<Button
	title="Insert link ({ctrlKey}K)"
	on:click={link}
	disabled={!canEdit}
	isActive={hasLink}
	class="max-h-8 min-h-8 min-w-8 max-w-8 lg:max-h-[unset] lg:min-h-[unset]"
>
	{#if hasLink}
		<div class="relative -m-2 flex items-center p-2">
			<Link2Icon />
			<SettingsIcon size={'16'} class="absolute right-0 top-0" />
		</div>
	{:else}
		<Link2Icon />
	{/if}
</Button>
