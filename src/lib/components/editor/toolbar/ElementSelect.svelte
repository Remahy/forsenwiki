<script>
	import { getContext, onMount } from 'svelte';
	import {
		$createHeadingNode as createHeadingNode,
		$createQuoteNode as createQuoteNode,
		$isHeadingNode as isHeadingNode
	} from '@lexical/rich-text';
	import {
		$isListNode as isListNode,
		$isListItemNode as isListItemNode,
		INSERT_ORDERED_LIST_COMMAND,
		INSERT_UNORDERED_LIST_COMMAND,
		ListNode
	} from '@lexical/list';
	import {
		$getSelection as getSelection,
		$isRangeSelection as isRangeSelection,
		$createParagraphNode as createParagraphNode,
		$isRootOrShadowRoot as isRootOrShadowRoot,
		SELECTION_CHANGE_COMMAND
	} from 'lexical';
	import {
		$getNearestNodeOfType as getNearestNodeOfType,
		$findMatchingParent as findMatchingParent
	} from '@lexical/utils';
	import { $setBlocksType as setBlocksType } from '@lexical/selection';

	import Select from '$lib/components/Select.svelte';
	import { ELEMENT_CONSTANTS } from '$lib/constants/element';
	import { CriticalPriority } from '$lib/constants/lexical';
	import { getSelectedElements } from '$lib/environment/utils';

	const { TYPES } = ELEMENT_CONSTANTS;
	const elementTypeOptions = Object.entries(TYPES);

	const validValues = Object.keys(TYPES);

	/** @type {HTMLSelectElement} */
	let elementTypeElement;

	let currentElementType = '';

	/** @type {ComposerWritable} */
	const c = getContext('COMPOSER');
	$: composer = $c;
	$: canEdit = composer?.getEditor().isEditable();
	$: editor = composer?.getEditor();

	const formatParagraph = () => {
		if (!editor) return;

		editor.update(() => {
			const selection = getSelection();
			if (isRangeSelection(selection)) {
				setBlocksType(selection, () => createParagraphNode());
			}
		});
	};

	/**
	 * @param {import("@lexical/rich-text").HeadingTagType} headingSize
	 */
	const formatHeading = (headingSize) => {
		if (!editor) return;

		if (currentElementType !== headingSize) {
			editor.update(() => {
				const selection = getSelection();
				setBlocksType(selection, () => createHeadingNode(headingSize));
			});
		}
	};

	const formatBulletList = () => {
		if (!editor) return;

		if (currentElementType !== 'bullet') {
			editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
		} else {
			formatParagraph();
		}
	};

	const formatNumberedList = () => {
		if (!editor) return;

		if (currentElementType !== 'number') {
			editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
		} else {
			formatParagraph();
		}
	};

	const formatQuote = () => {
		if (!editor) return;

		if (currentElementType !== 'quote') {
			editor.update(() => {
				const selection = getSelection();
				setBlocksType(selection, () => createQuoteNode());
			});
		}
	};

	/**
	 * @type {any}
	 */
	const blockTypeFunction = {
		h1: formatHeading,
		h2: formatHeading,
		h3: formatHeading,
		h4: formatHeading,
		h5: formatHeading,
		bullet: formatBulletList,
		number: formatNumberedList,
		paragraph: formatParagraph,
		quote: formatQuote
	};

	/** @param {Event} e */
	const elementType = (e) => {
		if (!editor) return;

		/** @type {HTMLSelectElement} */
		const target = /** @type {any} */ (e.target);
		if (target) {
			// These are only used as placeholders, don't action on them.
			if (['mixed', 'unknown'].includes(target.value)) {
				return;
			}

			/** @type {keyof typeof TYPES} */
			const value = /** @type {any} */ (target.value);

			if (!validValues.includes(value)) {
				return;
			}

			const func = blockTypeFunction[value];
			if (func) {
				func(value);
			}
		}
	};

	const updateToolbar = () => {
		if (!editor) return;

		const selection = getSelection();
		if (isRangeSelection(selection)) {
			const anchorNode = selection.anchor.getNode();

			const elements = getSelectedElements();
			const elementTypes = [
				...new Set(
					elements.map((element) => {
						if (isListNode(element)) {
							const parentList = getNearestNodeOfType(element, ListNode);
							const type = parentList ? parentList.getListType() : element.getListType();
							return type;
						}

						if (isListItemNode(element)) {
							const parentList = getNearestNodeOfType(element, ListNode);
							const type = parentList ? parentList.getListType() : 'unknown';
							return type;
						}

						const type = isHeadingNode(element) ? element.getTag() : element.getType();
						if (type in TYPES) {
							return type;
						}

						return 'unknown';
					})
				)
			];

			if (elementTypes.length > 1) {
				currentElementType = 'mixed';
				return;
			} else {
				currentElementType = elementTypes[0];
			}

			let element =
				anchorNode.getKey() === 'root'
					? anchorNode
					: findMatchingParent(anchorNode, (e) => {
							const parent = e.getParent();
							return parent !== null && isRootOrShadowRoot(parent);
						});

			if (element === null) {
				element = anchorNode.getTopLevelElementOrThrow();
			}

			const elementKey = element.getKey();
			const elementDOM = editor.getElementByKey(elementKey);

			if (elementDOM !== null) {
				if (isListNode(element)) {
					const parentList = getNearestNodeOfType(anchorNode, ListNode);
					const type = parentList ? parentList.getListType() : element.getListType();
					currentElementType = type;
				} else if (isListItemNode(element)) {
					const parentList = getNearestNodeOfType(anchorNode, ListNode);
					const type = parentList ? parentList.getListType() : 'unknown';
					currentElementType = type;
				} else {
					const type = isHeadingNode(element) ? element.getTag() : element.getType();
					if (type in TYPES) {
						currentElementType = type;
					}
				}
			}
		}
	};

	onMount(() => {
		c.subscribe((composer) => {
			if (composer === null) {
				return;
			}

			const editor = composer.getEditor();

			editor.registerCommand(
				SELECTION_CHANGE_COMMAND,
				(_payload) => {
					updateToolbar();
					return false;
				},
				CriticalPriority
			);
		});
	});
</script>

<Select
	title="Element type"
	disabled={!canEdit}
	bind:ref={elementTypeElement}
	on:change={elementType}
	bind:value={currentElementType}
	on:click={() => elementTypeElement.dispatchEvent(new Event('change'))}
>
	<option value="mixed" hidden>Mixed</option>
	<option value="unknown" hidden>Unknown</option>

	{#each elementTypeOptions as [value, label]}
		<option {value}>{label}</option>
	{/each}
</Select>
