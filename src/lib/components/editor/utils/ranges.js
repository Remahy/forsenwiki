// https://github.com/facebook/lexical/blob/main/packages/lexical-yjs/src/SyncCursors.ts
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
	$isElementNode as isElementNode,
	$isRangeSelection as isRangeSelection,
	$isTextNode as isTextNode,
} from 'lexical';
import {
	createAbsolutePositionFromRelativePosition,
	createRelativePositionFromTypeIndex,
} from '$lib/yjs/utils';

/**
 * @param {import('lexical').Point} point
 * @param {any} binding
 * @param {number} assoc
 */
function createRelativePosition(point, binding, assoc = 0) {
	const collabNodeMap = binding.collabNodeMap;
	const collabNode = collabNodeMap.get(point.key);

	if (collabNode === undefined) {
		return null;
	}

	let offset = point.offset;
	let sharedType = collabNode.getSharedType();

	// CollabTextNode is not exported by Lexical.
	if (collabNode.constructor.name === 'CollabTextNode') {
		sharedType = collabNode._parent._xmlText;
		const currentOffset = collabNode.getOffset();

		if (currentOffset === -1) {
			return null;
		}

		offset = currentOffset + 1 + offset;
		// CollabElementNode is not exported by Lexical.
	} else if (collabNode.constructor.name === 'CollabElementNode' && point.type === 'element') {
		const parent = point.getNode();

		if (!isElementNode(parent)) {
			throw new Error('Element point must be an element node');
		}

		let accumulatedOffset = 0;
		let i = 0;
		let node = parent.getFirstChild();
		while (node !== null && i++ < offset) {
			if (isTextNode(node)) {
				accumulatedOffset += node.getTextContentSize() + 1;
			} else {
				accumulatedOffset++;
			}
			node = node.getNextSibling();
		}
		offset = accumulatedOffset;
	}

	return createRelativePositionFromTypeIndex(sharedType, offset, assoc);
}

/**
 * @param {any} binding
 * @param {BaseSelection} selection
 */
export function createRelativeRange(binding, selection) {
	if (isRangeSelection(selection)) {
		// For a non-collapsed range, give each endpoint an assoc that sticks it to
		// the character it should track rather than the gap between characters:
		//   left endpoint  (assoc >= 0): anchors to the first selected character,
		//                                so inserts before the selection stay outside.
		//   right endpoint (assoc  < 0): anchors to the last selected character,
		//                                so inserts after the selection stay outside.
		// Collapsed carets keep assoc = 0 on both sides (the default) so the caret
		// naturally follows typing, matching the pre-existing behaviour.
		const isCollapsed = selection.isCollapsed();
		const isBackward = !isCollapsed && selection.isBackward();
		const anchorAssoc = isBackward ? -1 : 0;
		const focusAssoc = !isCollapsed && !isBackward ? -1 : 0;

		const anchorPos = createRelativePosition(selection.anchor, binding, anchorAssoc);
		const focusPos = createRelativePosition(selection.focus, binding, focusAssoc);

		return { anchorPos, focusPos };
	}

	return null;
}

/**
 * @param {ElementNode} node
 * @param {number} offset
 * @param {boolean} boundaryIsEdge
 */
function getPositionFromElementAndOffset(node, offset, boundaryIsEdge) {
	let index = 0;
	let i = 0;
	// @ts-ignore
	const children = node._children;
	const childrenLength = children.length;

	for (; i < childrenLength; i++) {
		const child = children[i];
		const childOffset = index;
		const size = child.getSize();
		index += size;
		const exceedsBoundary = boundaryIsEdge ? index >= offset : index > offset;

		if (exceedsBoundary && child.constructor.name === 'CollabTextNode') {
			let textOffset = offset - childOffset - 1;

			if (textOffset < 0) {
				textOffset = 0;
			}

			const diffLength = index - offset;
			return {
				length: diffLength,
				node: child,
				nodeIndex: i,
				offset: textOffset,
			};
		}

		if (index > offset) {
			return {
				length: 0,
				node: child,
				nodeIndex: i,
				offset: childOffset,
			};
		} else if (i === childrenLength - 1) {
			return {
				length: 0,
				node: null,
				nodeIndex: i + 1,
				offset: childOffset + 1,
			};
		}
	}

	return {
		length: 0,
		node: null,
		nodeIndex: 0,
		offset: 0,
	};
}

/**
 * @param {any} sharedType
 * @param {number} offset
 */
function getCollabNodeAndOffset(sharedType, offset) {
	const collabNode = sharedType._collabNode;

	if (collabNode === undefined) {
		return [null, 0];
	}

	if (collabNode.constructor.name === 'CollabElementNode') {
		const { node, offset: collabNodeOffset } = getPositionFromElementAndOffset(
			collabNode,
			offset,
			true
		);

		if (node === null) {
			return [collabNode, collabNode._children.length];
		} else {
			return [node, collabNodeOffset];
		}
	}

	return [null, 0];
}

/**
 * @param {import('yjs').Doc} doc
 * @param {{ anchor: import('yjs').RelativePosition, focus: import('yjs').RelativePosition }} yjsRange
 */
export function createAbsoluteRange(doc, yjsRange) {
	const anchorAbsPos = createAbsolutePositionFromRelativePosition(yjsRange.anchor, doc);
	const focusAbsPos = createAbsolutePositionFromRelativePosition(yjsRange.focus, doc);

	if (anchorAbsPos !== null && focusAbsPos !== null) {
		const [anchorNode, anchorOffset] = getCollabNodeAndOffset(
			anchorAbsPos.type,
			anchorAbsPos.index
		);
		const [focusNode, focusOffset] = getCollabNodeAndOffset(focusAbsPos.type, focusAbsPos.index);

		return {
			anchorNode,
			anchorOffset,
			focusNode,
			focusOffset,
		};
	}

	return null;
}
