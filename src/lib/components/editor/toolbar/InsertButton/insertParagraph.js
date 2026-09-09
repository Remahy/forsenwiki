import {
	$isRangeSelection as isRangeSelection,
	$isRootOrShadowRoot as isRootOrShadowRoot,
	$createParagraphNode as createParagraphNode,
	$getSelection as getSelection,
	$isParagraphNode as isParagraphNode,
	$isTextNode as isTextNode,
	$insertNodes as insertNodes,
	$isInlineElementOrDecoratorNode as isInlineElementOrDecoratorNode,
	$isRootNode as isRootNode,
} from 'lexical';
import { $insertNodeToNearestRoot as insertNodeToNearestRoot } from '@lexical/utils';
import { $isListItemNode as isListItemNode } from '@lexical/list';

/**
 * @param {LexicalEditor} editor
 * @param {'after' | 'before' | undefined} [adjacent]
 */
export const insertParagraph = (editor, adjacent) =>
	editor.update(() => {
		const selection = getSelection();

		const [nodeAtSelection] = selection?.getNodes() || [];

		if (!nodeAtSelection) {
			return;
		}

		const hasParagraphNodeParent =
			nodeAtSelection.getParents().find((n) => isParagraphNode(n)) ||
			isParagraphNode(nodeAtSelection);

		if (hasParagraphNodeParent) {
			return;
		}

		const node = createParagraphNode();

		if (!isRangeSelection(selection)) {
			if (isRootOrShadowRoot(nodeAtSelection) && !adjacent) {
				const firstChild = nodeAtSelection.getFirstChild();
				if (firstChild) {
					firstChild.insertBefore(node);
					node.selectStart();
					return;
				}

				nodeAtSelection.selectStart();
				insertNodes([node]);
				node.selectStart();
				return;
			}

			if (adjacent === 'before') {
				nodeAtSelection.insertBefore(node);
				node.selectStart();
			} else {
				insertNodeToNearestRoot(node).selectStart();
			}
			return;
		}

		const initialNode = selection.anchor.getNode();
		const isLeaf = isTextNode(initialNode);

		if (!isLeaf) {
			return;
		}

		let isFirstInParentNode = false;
		let rootParent;

		const parents = initialNode.getParents().filter((n) => !isRootNode(n));
		for (let index = 0; index < parents.length; index++) {
			const parent = parents[index];

			rootParent = parents[index - 1] || initialNode;

			if (parent.getFirstChild() === rootParent) {
				isFirstInParentNode = true;
			} else {
				isFirstInParentNode = false;
				rootParent = parents.find((n) => !isInlineElementOrDecoratorNode(n));
				break;
			}

			if (!isInlineElementOrDecoratorNode(parent) && !isListItemNode(parent)) {
				rootParent = parent;
				break;
			}
		}

		if (isFirstInParentNode && selection.anchor.offset === 0) {
			rootParent?.insertBefore(node);
			node.selectStart();
			return;
		}

		rootParent?.insertAfter(node);
		node.selectStart();
	});
