import {
	$createParagraphNode,
	$createTextNode,
	$getSelection,
	$isTextNode,
	COMMAND_PRIORITY_EDITOR,
	COMMAND_PRIORITY_NORMAL,
	createCommand,
	KEY_ARROW_LEFT_COMMAND,
	KEY_ARROW_RIGHT_COMMAND,
} from 'lexical';
import { defineExtension } from '@lexical/extension';
import { $isAtNodeEnd } from '@lexical/selection';
import { $insertNodeToNearestRoot, mergeRegister } from '@lexical/utils';

import { hasAdjacentNode, insertFnc } from '../../utils/insertUtils';
import { $createFloatBlockNode, $isFloatBlockNode } from './FloatBlock';

/**
 * @typedef {import('lexical').PointType} PointType
 * @typedef {Readonly<import('./FloatBlock').FloatBlockNodePayload>} FloatBlockNodePayload
 */

/** @type {import('lexical').LexicalCommand<FloatBlockNodePayload>} */
export const INSERT_FLOATBLOCK_COMMAND = createCommand();

const INSERT_BEFORE = true;
const INSERT_AFTER = false;

/**
 * @param {LexicalEditor} editor
 * @param {FloatBlockNodePayload} payload
 */
const insertFloatBlock = (editor, { float, width, height, hasBorder }) => {
	editor.update(() => {
		const floatBlockNode = $createFloatBlockNode({ float, width, height, hasBorder });

		$insertNodeToNearestRoot(floatBlockNode);

		floatBlockNode.append($createParagraphNode().append($createTextNode()));

		const firstDescendant = floatBlockNode.getFirstDescendant();

		if ($isTextNode(firstDescendant)) {
			firstDescendant.select();
		}
	});
};

/** @param {boolean} atBefore */
const $insertParagraphAtFloatBlockEdge = (atBefore) => {
	const selection = $getSelection();
	if (!selection?.isCollapsed()) {
		return false;
	}

	const [anchor, focus] = /** @type {[PointType, PointType]} */ (selection.getStartEndPoints());
	const anchorNode = anchor.getNode();

	const floatBlockParent = anchorNode.getParents().find((n) => $isFloatBlockNode(n));

	if (!floatBlockParent) {
		return false;
	}

	let isAtStart;
	let isAtEnd;
	if ($isTextNode(anchorNode)) {
		const allTextNodes = floatBlockParent.getAllTextNodes();

		isAtStart = anchor.offset === 0 && allTextNodes[0] === anchorNode;
		isAtEnd = $isAtNodeEnd(focus) && allTextNodes[allTextNodes.length - 1] === anchorNode;
	} else {
		isAtStart = anchor.offset === 0 && floatBlockParent.getFirstChild() === anchorNode;
		isAtEnd = $isAtNodeEnd(focus) && floatBlockParent.getLastChild() === anchorNode;
	}

	const isAtEdge = isAtStart || isAtEnd;

	const adjacentNode = hasAdjacentNode(atBefore, floatBlockParent);

	if (!isAtEdge || adjacentNode) {
		return false;
	}

	const newNode = $createParagraphNode().append($createTextNode());
	insertFnc(atBefore, floatBlockParent, newNode).selectStart();

	return true;
};

/** @param {KeyboardEvent} event @param {boolean} atBefore */
const onArrow = (event, atBefore) =>
	event.ctrlKey ? false : $insertParagraphAtFloatBlockEdge(atBefore);

export const FloatBlockExtension = defineExtension({
	name: 'article/float-block',
	register: (editor) =>
		mergeRegister(
			editor.registerCommand(
				INSERT_FLOATBLOCK_COMMAND,
				(payload) => {
					insertFloatBlock(editor, payload);
					return true;
				},
				COMMAND_PRIORITY_EDITOR
			),
			editor.registerCommand(
				KEY_ARROW_LEFT_COMMAND,
				(event) => onArrow(event, INSERT_BEFORE),
				COMMAND_PRIORITY_NORMAL
			),
			editor.registerCommand(
				KEY_ARROW_RIGHT_COMMAND,
				(event) => onArrow(event, INSERT_AFTER),
				COMMAND_PRIORITY_NORMAL
			)
		),
});
