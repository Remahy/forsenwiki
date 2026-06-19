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
import { createRelativePositionFromTypeIndex } from '$lib/yjs/utils';

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
