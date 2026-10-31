import {
	$createNodeSelection as createNodeSelection,
	$setSelection as setSelection,
	$isParagraphNode as isParagraphNode,
	$isTextNode as isTextNode,
} from 'lexical';
import { $getNearestNodeOfType as getNearestNodeOfType } from '@lexical/utils';
import { $isListItemNode as isListItemNode, $isListNode as isListNode } from '@lexical/list';
import { $isQuoteNode as isQuoteNode, $isHeadingNode as isHeadingNode } from '@lexical/rich-text';
import { ListNode } from '$lib/lexical/index';
import { blockTypeLabels } from '$lib/constants/element';
import { alignmentIcons, blockTypeIcons } from '$lib/constants/blockTypeIcons';
import {
	$isImageNode as isImageNode,
	$isVideoEmbedNode as isVideoEmbedNode,
} from '$lib/lexical/custom';
import { DOMAIN } from '$lib/environment/environment';
import { getURLAndTitle } from '../plugins/VideoEmbed/VideoEmbed';

/**
 * @typedef {import('@headless-tree/core').ItemInstance<LexicalNode>} ItemInstance
 */

/**
 * @param {LexicalNode} node
 */
export const getTypeForNode = (node) => {
	if (isTextNode(node)) {
		return node.getType();
	}

	if (isListNode(node)) {
		const parentList = getNearestNodeOfType(node, ListNode);
		return parentList ? parentList.getListType() : node.getListType();
	}

	if (isVideoEmbedNode(node)) {
		const src = node.getSrc();

		const type = node.getType();
		if (!src) {
			return type;
		}

		const platform = node.getPlatform();

		switch (platform) {
			case 'usercontent': {
				const fileType = node.getFileType();
				return fileType || type;
			}
			case 'twitch':
			case 'youtube':
				return platform;
			default:
				return type;
		}
	}

	const type = isHeadingNode(node) ? node.getTag() : node.getType();

	return type;
};

const textLikeNodes = [isTextNode, isHeadingNode, isParagraphNode, isListItemNode, isQuoteNode];

/**
 * @param {LexicalNode} node
 */
const isTextLikeNode = (node) => {
	return textLikeNodes.find((fn) => fn(node));
};

const altTextNodes = [isImageNode, isVideoEmbedNode];

/**
 * @param {LexicalNode} node
 */
const hasAltText = (node) => {
	return altTextNodes.find((fn) => fn(node));
};

/**
 * @param {LexicalNode} node
 */
export const getTypeLabelForNode = (node) => {
	const type = getTypeForNode(node);

	// @ts-ignore
	return blockTypeLabels[type] ?? type;
};

/** @param {string} text */
const shortenText = (text) => (text.length > 26 ? `${text.substring(0, 24)}...` : text);

/**
 * @param {LexicalNode} node
 */
export const getLabelForNode = (node) => {
	if (isTextLikeNode(node)) {
		const textContent = node.getTextContent();

		return shortenText(textContent);
	}

	if (hasAltText(node)) {
		// @ts-ignore
		const altText = node.getAltText();

		if (altText) {
			return shortenText(altText);
		}
	}

	if (isVideoEmbedNode(node)) {
		const { title } = getURLAndTitle(node.getPlatform(), node.getSrc(), DOMAIN);

		if (title) {
			return shortenText(title);
		}
	}

	return getTypeLabelForNode(node);
};

/**
 * @param {LexicalNode} node
 */
export const getIconForLNode = (node) => {
	if (isParagraphNode(node)) {
		const format = node.getFormatType();

		// @ts-ignore
		return alignmentIcons[format] || alignmentIcons.default;
	}

	// @ts-ignore
	return blockTypeIcons[getTypeForNode(node)];
};

/**
 * @param {import('@headless-tree/core').TreeInstance<LexicalNode>} tree
 * @param {ItemInstance} item
 */
export const expandParents = (tree, item) => {
	const parentKeys = item.getParentKeys().reverse();

	for (let index = 0; index < parentKeys.length; index++) {
		const key = parentKeys[index];
		const parent = tree.getItemInstance(key);

		// expand() always rebuilds the tree, even if the item is already expanded.
		if (!parent.isExpanded()) {
			parent.expand();
		}
	}

	if (!item.isExpanded()) {
		item.expand();
	}
};

/**
 * Checks whether nodes were added, removed or moved. Unchanged nodes are shared
 * between editor states, so only nodes that were actually edited get compared.
 *
 * @param {import('lexical').EditorState} prevEditorState
 * @param {import('lexical').EditorState} editorState
 */
export const hasTreeStructureChanged = (prevEditorState, editorState) => {
	const prevNodeMap = prevEditorState._nodeMap;
	const nodeMap = editorState._nodeMap;

	if (prevNodeMap.size !== nodeMap.size) {
		return true;
	}

	for (const [key, node] of nodeMap) {
		const prevNode = prevNodeMap.get(key);

		if (prevNode === node) {
			continue;
		}

		if (
			!prevNode ||
			prevNode.__parent !== node.__parent ||
			prevNode.__prev !== node.__prev ||
			prevNode.__next !== node.__next
		) {
			return true;
		}
	}

	return false;
};

/**
 * @param {typeof import('./treeviewState.svelte').treeviewState} state
 */
export const updateItems = (state) => {
	if (!state.tree) {
		return;
	}

	state.items = state.tree.getItems();
};

/**
 * @param {typeof import('./treeviewState.svelte').treeviewState} state
 * @param {LexicalEditor} editor
 * @param {ItemInstance} item
 */
export const handleOnClickTreeNode = (state, editor, item) => {
	state.isTreeNodeSelection = true;

	const node = item.getItemData();

	state.tree?.setSelectedItems([item.getId()]);

	updateItems(state);

	editor._rootElement?.focus({ preventScroll: true });

	editor.update(
		() => {
			if (isParagraphNode(node) || isTextNode(node)) {
				node.selectEnd();
			} else {
				const selection = createNodeSelection();
				selection.add(node.getKey());
				setSelection(selection);
			}

			const element = editor.getElementByKey(node.getKey());
			element?.scrollIntoView({
				behavior: 'instant',
				block: 'center',
				inline: 'center',
			});

			state.selected = node;
		},
		{ discrete: true }
	);

	state.isTreeNodeSelection = false;
};

/**
 * @param {Record<string, any>} obj
 */
export const styleObjectToString = (obj) => {
	let str = '';

	const keys = Object.keys(obj);

	for (let index = 0; index < keys.length; index++) {
		const key = keys[index];
		const rawValue = obj[key];

		let val = rawValue;

		if (typeof val === 'number') {
			val = rawValue + 'px';
		}

		str += `${key}: ${val};`;
	}

	return str;
};
